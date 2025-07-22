-- Table pour les événements du calendrier
CREATE TABLE calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Type d'événement
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'training', 'competition', 'individual_session', 'meeting', 'other'
    )),
    
    -- Dates et heures
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    
    -- Localisation
    location VARCHAR(255),
    
    -- Organisateur (toujours un coach)
    organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Métadonnées
    max_participants INTEGER,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB, -- Pour les événements récurrents
    
    -- Statut
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    
    -- Visibilité
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'coaches_only')),
    
    -- Couleur pour l'affichage
    color VARCHAR(7) DEFAULT '#3b82f6', -- Hex color code
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les participants aux événements
CREATE TABLE calendar_event_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Statut de participation
    status VARCHAR(20) DEFAULT 'invited' CHECK (status IN (
        'invited', 'accepted', 'declined', 'maybe', 'attended', 'absent'
    )),
    
    -- Note du coach sur la participation
    coach_notes TEXT,
    
    -- Timestamps
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte d'unicité
    UNIQUE(event_id, participant_id)
);

-- Index pour les performances
CREATE INDEX idx_calendar_events_dates ON calendar_events(start_datetime, end_datetime);
CREATE INDEX idx_calendar_events_organizer ON calendar_events(organizer_id);
CREATE INDEX idx_calendar_events_type ON calendar_events(event_type);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);
CREATE INDEX idx_event_participants_event ON calendar_event_participants(event_id);
CREATE INDEX idx_event_participants_participant ON calendar_event_participants(participant_id);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_calendar_events_updated_at 
    BEFORE UPDATE ON calendar_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_event_participants_updated_at 
    BEFORE UPDATE ON calendar_event_participants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies pour calendar_events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Les coaches peuvent voir tous les événements publics et leurs propres événements
CREATE POLICY "Coaches can view events" ON calendar_events FOR SELECT
USING (
    auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'coach'
    ) AND (
        visibility IN ('public', 'coaches_only') OR 
        organizer_id = auth.uid()
    )
);

-- Les athlètes peuvent voir les événements publics et ceux auxquels ils participent
CREATE POLICY "Athletes can view relevant events" ON calendar_events FOR SELECT
USING (
    auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'athlete'
    ) AND (
        visibility = 'public' OR
        id IN (
            SELECT event_id FROM calendar_event_participants 
            WHERE participant_id = auth.uid()
        )
    )
);

-- Seuls les coaches peuvent créer des événements
CREATE POLICY "Coaches can create events" ON calendar_events FOR INSERT
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'coach'
    ) AND organizer_id = auth.uid()
);

-- Les coaches peuvent modifier leurs propres événements
CREATE POLICY "Coaches can update own events" ON calendar_events FOR UPDATE
USING (
    auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'coach'
    ) AND organizer_id = auth.uid()
);

-- Les coaches peuvent supprimer leurs propres événements
CREATE POLICY "Coaches can delete own events" ON calendar_events FOR DELETE
USING (
    auth.uid() IN (
        SELECT id FROM profiles WHERE role = 'coach'
    ) AND organizer_id = auth.uid()
);

-- RLS Policies pour calendar_event_participants
ALTER TABLE calendar_event_participants ENABLE ROW LEVEL SECURITY;

-- Voir les participations aux événements visibles
CREATE POLICY "View event participants" ON calendar_event_participants FOR SELECT
USING (
    event_id IN (
        SELECT id FROM calendar_events WHERE (
            auth.uid() IN (SELECT id FROM profiles WHERE role = 'coach') AND (
                visibility IN ('public', 'coaches_only') OR organizer_id = auth.uid()
            )
        ) OR (
            auth.uid() IN (SELECT id FROM profiles WHERE role = 'athlete') AND (
                visibility = 'public' OR participant_id = auth.uid()
            )
        )
    )
);

-- Les coaches peuvent ajouter des participants à leurs événements
CREATE POLICY "Coaches can add participants" ON calendar_event_participants FOR INSERT
WITH CHECK (
    auth.uid() IN (
        SELECT organizer_id FROM calendar_events WHERE id = event_id
    )
);

-- Les coaches peuvent modifier les participations à leurs événements
CREATE POLICY "Coaches can update participants" ON calendar_event_participants FOR UPDATE
USING (
    auth.uid() IN (
        SELECT organizer_id FROM calendar_events WHERE id = event_id
    )
);

-- Les participants peuvent modifier leur propre statut
CREATE POLICY "Participants can update own status" ON calendar_event_participants FOR UPDATE
USING (participant_id = auth.uid())
WITH CHECK (participant_id = auth.uid());

-- Les coaches peuvent supprimer des participations à leurs événements
CREATE POLICY "Coaches can remove participants" ON calendar_event_participants FOR DELETE
USING (
    auth.uid() IN (
        SELECT organizer_id FROM calendar_events WHERE id = event_id
    )
);