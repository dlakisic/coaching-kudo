const webpush = require('web-push');

console.log('🔑 Génération des clés VAPID pour les notifications push...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ Clés VAPID générées avec succès !\n');
console.log('📋 Ajoute ces variables à ton fichier .env.local :\n');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:admin@coaching-kudo.com');
console.log('\n🔒 IMPORTANT : Garde la clé privée secrète !');