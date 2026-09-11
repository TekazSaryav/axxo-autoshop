import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { TelegramWebAppUser } from './types.js';

export type Language = 'fr' | 'en';

export const translations = {
  fr: {
    // Navbar
    shop_badge: '24/7',
    official_shop: 'Autoshop Officiel',
    support_reviews: 'Support & Avis',
    my_orders: 'Mes Commandes',
    cart: 'Panier',

    // Hero banner
    hero_pill: 'Autoshop Automatisé • Délivrance 24/7',
    hero_title: 'Comptes, licences & abonnements en livraison directe',
    hero_desc: 'Réglez en Crypto (BTC, LTC, SOL) ou Carte Bancaire et recevez immédiatement vos accès dans l\'application.',
    in_stock: 'en stock',
    support_btn: 'Support @notthatid',
    channel_btn: 't.me/TekazMarket',

    // Search & categories
    search_placeholder: 'Rechercher un produit, abonnement, jeu...',
    all_categories: 'Tous',

    // Product cards
    from_price: 'À partir de',
    single_price: 'Prix unique',
    formulas_choice: 'formules au choix',
    details: 'Détails',
    add_to_cart: 'Ajouter au panier',
    out_of_stock: 'Épuisé',
    available_24_7: 'Dispo 24/7',
    left_stock: 'restants',

    // Product modal
    vat_instant: 'TVA incluse • Livraison 24/7',
    select_formula: 'Sélectionnez une formule / option',
    quantity: 'Quantité',
    total_to_pay: 'Total à régler',
    instant_buy: 'Acheter maintenant',
    product_description: 'Description du produit',
    instant_delivery_feature: 'Livraison Automatique Immédiate',
    instant_delivery_desc: 'Identifiants ou clés transmis dès confirmation du paiement',
    warranty_feature: 'Garantie & Remplacement',
    warranty_desc: 'Support réactif et SAV assuré en cas de problème',
    out_of_stock_btn: 'Rupture de stock temporaire',

    // Cart Drawer
    my_cart: 'Mon Panier',
    diff_items: 'articles différents',
    single_item: 'article sélectionné',
    cart_empty: 'Votre panier est vide',
    cart_empty_desc: 'Explorez nos catégories et ajoutez des abonnements à votre commande !',
    email_label: 'Adresse email de réception',
    email_placeholder: 'votre.email@exemple.com',
    email_hint: 'Vos accès et identifiants y seront également envoyés.',
    email_invalid: 'Veuillez entrer une adresse email valide',
    total_cart: 'Total de la commande',
    pay_btn: 'Payer en Crypto / Carte',
    pay_stars_btn: 'Payer avec Telegram Stars',
    pay_method_title: 'Choisissez votre moyen de paiement',
    pay_crypto_card_title: 'Crypto & Carte Bancaire',
    pay_crypto_card_desc: 'BTC, LTC, SOL, ETH, USDT & Cartes (via SellAuth)',
    pay_stars_title: 'Telegram Stars (⭐)',
    pay_stars_desc: 'Paiement 1-clic direct dans Telegram (+30% frais Apple/Google)',
    stars_fee_included: 'Frais inclus',
    paying: 'Génération de la facture...',
    paying_stars: 'Ouverture du paiement Stars...',
    stars_payment_success: 'Paiement Stars réussi ! Votre commande a été enregistrée et confirmée dans Telegram.',
    stars_payment_failed: 'Le paiement en Stars a échoué ou a été annulé.',
    secure_guarantee: 'Paiements traités via SellAuth & Telegram • Sécurisé & Chiffré',
    view_cart_floating: 'Voir mon panier',

    // Orders Tab
    orders_title: 'Mes Commandes',
    orders_subtitle: 'Historique d\'achats et factures',
    no_orders_title: 'Aucune commande récente',
    no_orders_desc: 'Vos achats et livrables apparaîtront automatiquement ici dès que vous aurez validé un panier.',
    paid_status: 'Payé & Livré',
    pending_status: 'En attente',
    deliverables_label: 'Livrables / Identifiants :',

    // Support Modal
    support_community_title: 'Support & Communauté',
    support_community_sub: 'Assistance, avis vérifiés & restocks',
    tab_assistance: 'Assistance',
    tab_reviews: 'Avis',
    tab_restocks: 'Restocks',
    support_card_title: 'Support Privé 24/7',
    support_card_sub: 'Contact direct Telegram',
    support_card_desc: 'Pour toute demande, assistance technique, remplacement sous garantie ou question avant-vente, écrivez directement à notre agent :',
    support_card_btn: 'Contacter @notthatid sur Telegram',
    channel_card_title: 'Canal Officiel Tekaz',
    channel_card_desc: 'Rejoignez notre canal officiel pour être averti en avant-première des restocks exclusifs, des drops de nouveaux comptes et des promotions !',
    channel_card_btn: 'Rejoindre le Canal t.me/TekazMarket',
    security_note: 'Toutes les transactions effectuées sur Tekaz Market sont couvertes par notre garantie de remplacement automatique et gérées via la passerelle SellAuth.',
    reviews_based_on: 'Basé sur',
    verified_reviews: 'avis certifiés SellAuth',
    reviews_positive: '100% Positif',
    loading_reviews: 'Chargement des avis SellAuth...',
    verified_purchase: 'Achat vérifié & validé instantanément',
    view_all_reviews: 'Afficher tous les avis',
    view_all_reviews_desc: 'Consultez l\'intégralité des avis clients sur tekaz.xyz/feedback',
    restocks_header_info: 'Tous les réapprovisionnements ci-dessous sont en stock immédiat 24/7.',
    in_stock_badge: 'EN STOCK',
    unlimited: 'Illimité',
    dispo: 'dispo',

    // Checkout Modal
    payment_title: 'Paiement de la commande',
    awaiting_payment: 'En attente de paiement',
    payment_detected: 'Paiement Reçu avec Succès !',
    order_id: 'Numéro de commande :',
    order_id_copied: 'ID Copié !',
    copy_order_id: 'Copier le numéro de commande',
    deliverables_received: 'Vos Identifiants & Accès :',
    copied: 'Copié !',
    copy_all: 'Tout copier',
    open_payment_page: 'Accéder à la Page de Paiement',
    crypto_cards_accepted: 'Accepté : Crypto (BTC, LTC, SOL, ETH, USDT) & Carte Bancaire',
    payment_instructions: 'Réglez votre facture sur la page SellAuth sécurisée. Dès confirmation sur la blockchain ou par carte, cette page se mettra à jour automatiquement.',
    close_btn: 'Fermer',

    // Errors & states
    loading_error: 'Erreur de chargement',
    retry_conn: 'Réessayer la connexion',
    no_product_match: 'Aucun produit ne correspond à votre recherche',
    no_product_desc: 'Essayez un autre terme ou explorez toutes nos catégories.',
    // Language switcher
    switch_lang_title: 'Changer la langue (FR / EN)',

    // Reseller Mode
    reseller_badge: 'VIP Revendeur',
    reseller_banner: 'Mode Revendeur actif : remise de grossiste appliquée !',
    reseller_price_tag: 'Tarif Grossiste',
    reseller_discount_applied: 'Remise Revendeur',

    // Admin Panel
    admin_btn: 'Admin',
    admin_panel_title: 'Panel d\'Administration',
    admin_panel_sub: 'Gestion des stocks, commandes et revendeurs',
    admin_tab_dashboard: 'Tableau de bord',
    admin_tab_stock: 'Stocks Stars',
    admin_tab_orders: 'Commandes',
    admin_tab_resellers: 'Revendeurs',
    admin_total_revenue: 'Chiffre d\'affaires',
    admin_total_orders: 'Total Commandes',
    admin_total_resellers: 'Revendeurs Actifs',
    admin_total_stock: 'Stock Stars Disponible',
    admin_add_stock: 'Alimenter le Stock',
    admin_clear_stock: 'Vider le Stock',
    admin_add_reseller: 'Ajouter un Revendeur',
    admin_telegram_id_placeholder: 'ID Telegram (ex: 123456789)',
    admin_reseller_name_placeholder: 'Nom / Pseudo du client',
    admin_discount_placeholder: 'Remise % (ex: 20)',
    admin_stock_lines_placeholder: 'Collez vos comptes ou clés ici (un par ligne)...'
  },

  en: {
    // Navbar
    shop_badge: '24/7',
    official_shop: 'Official Autoshop',
    support_reviews: 'Support & Reviews',
    my_orders: 'My Orders',
    cart: 'Cart',

    // Hero banner
    hero_pill: 'Automated Autoshop • Instant Delivery 24/7',
    hero_title: 'Accounts, licenses & subscriptions with instant delivery',
    hero_desc: 'Pay with Crypto (BTC, LTC, SOL) or Credit Card and receive your credentials instantly in the app.',
    in_stock: 'in stock',
    support_btn: 'Support @notthatid',
    channel_btn: 't.me/TekazMarket',

    // Search & categories
    search_placeholder: 'Search for a product, subscription, game...',
    all_categories: 'All',

    // Product cards
    from_price: 'Starting from',
    single_price: 'Fixed price',
    formulas_choice: 'plans available',
    details: 'Details',
    add_to_cart: 'Add to Cart',
    out_of_stock: 'Out of stock',
    available_24_7: 'Instant 24/7',
    left_stock: 'left',

    // Product modal
    vat_instant: 'VAT included • 24/7 Instant Delivery',
    select_formula: 'Select a plan / variant',
    quantity: 'Quantity',
    total_to_pay: 'Total to pay',
    instant_buy: 'Buy Now',
    product_description: 'Product Description',
    instant_delivery_feature: 'Instant Automated Delivery',
    instant_delivery_desc: 'Credentials or keys delivered immediately upon payment confirmation',
    warranty_feature: 'Warranty & Replacement',
    warranty_desc: 'Responsive 24/7 customer support and guaranteed replacement',
    out_of_stock_btn: 'Temporarily out of stock',

    // Cart Drawer
    my_cart: 'My Cart',
    diff_items: 'different items',
    single_item: 'selected item',
    cart_empty: 'Your cart is empty',
    cart_empty_desc: 'Browse our categories and add subscriptions to your order!',
    email_label: 'Delivery email address',
    email_placeholder: 'your.email@example.com',
    email_hint: 'Your access credentials will also be emailed to this address.',
    email_invalid: 'Please enter a valid email address',
    total_cart: 'Order Total',
    pay_btn: 'Pay with Crypto / Card',
    pay_stars_btn: 'Pay with Telegram Stars',
    pay_method_title: 'Choose payment method',
    pay_crypto_card_title: 'Crypto & Credit Card',
    pay_crypto_card_desc: 'BTC, LTC, SOL, ETH, USDT & Cards (via SellAuth)',
    pay_stars_title: 'Telegram Stars (⭐)',
    pay_stars_desc: '1-Click instant checkout in Telegram (+30% Apple/Google fee)',
    stars_fee_included: 'Fee included',
    paying: 'Creating your invoice...',
    paying_stars: 'Opening Stars payment...',
    stars_payment_success: 'Stars payment successful! Your order has been recorded and confirmed in Telegram.',
    stars_payment_failed: 'Stars payment failed or was cancelled.',
    secure_guarantee: 'Payments processed by SellAuth & Telegram • Encrypted & Secure',
    view_cart_floating: 'View Cart',

    // Orders Tab
    orders_title: 'My Orders',
    orders_subtitle: 'Purchase history and invoices',
    no_orders_title: 'No recent orders',
    no_orders_desc: 'Your purchases and delivered credentials will appear automatically here after placing an order.',
    paid_status: 'Paid & Delivered',
    pending_status: 'Pending',
    deliverables_label: 'Delivered Credentials / Keys:',

    // Support Modal
    support_community_title: 'Support & Community',
    support_community_sub: 'Assistance, verified reviews & restocks',
    tab_assistance: 'Support',
    tab_reviews: 'Reviews',
    tab_restocks: 'Restocks',
    support_card_title: 'Private 24/7 Support',
    support_card_sub: 'Direct Telegram Contact',
    support_card_desc: 'For any technical assistance, warranty replacement, or pre-sales question, write directly to our agent:',
    support_card_btn: 'Contact @notthatid on Telegram',
    channel_card_title: 'Official Tekaz Channel',
    channel_card_desc: 'Join our official Telegram channel to get first access to exclusive restocks, new account drops, and discounts!',
    channel_card_btn: 'Join Channel t.me/TekazMarket',
    security_note: 'All transactions on Tekaz Market are covered by our automatic replacement guarantee and processed securely by SellAuth.',
    reviews_based_on: 'Based on',
    verified_reviews: 'SellAuth certified reviews',
    reviews_positive: '100% Positive',
    loading_reviews: 'Loading SellAuth reviews...',
    verified_purchase: 'Verified purchase & instant delivery',
    view_all_reviews: 'View all reviews',
    view_all_reviews_desc: 'Browse all verified customer reviews on tekaz.xyz/feedback',
    restocks_header_info: 'All restocked items below are in stock with instant 24/7 delivery.',
    in_stock_badge: 'IN STOCK',
    unlimited: 'Unlimited',
    dispo: 'available',

    // Checkout Modal
    payment_title: 'Order Checkout',
    awaiting_payment: 'Awaiting Payment',
    payment_detected: 'Payment Successfully Received!',
    order_id: 'Order ID:',
    order_id_copied: 'ID Copied!',
    copy_order_id: 'Copy order ID',
    deliverables_received: 'Your Delivered Credentials:',
    copied: 'Copied!',
    copy_all: 'Copy All',
    open_payment_page: 'Open Payment Gateway',
    crypto_cards_accepted: 'Accepted: Crypto (BTC, LTC, SOL, ETH, USDT) & Credit Card',
    payment_instructions: 'Pay your invoice on the secure SellAuth gateway. As soon as the transaction is confirmed, this window will update automatically.',
    close_btn: 'Close',

    // Errors & states
    loading_error: 'Loading Error',
    retry_conn: 'Retry Connection',
    no_product_match: 'No products matched your search',
    no_product_desc: 'Try another keyword or explore our full list of categories.',
    reset_filters: 'Reset filters',

    // Language switcher
    switch_lang_title: 'Switch language (FR / EN)',

    // Reseller Mode
    reseller_badge: 'VIP Reseller',
    reseller_banner: 'Reseller Mode active: wholesale discount applied!',
    reseller_price_tag: 'Wholesale Price',
    reseller_discount_applied: 'Reseller Discount',

    // Admin Panel
    admin_btn: 'Admin',
    admin_panel_title: 'Admin Dashboard',
    admin_panel_sub: 'Manage stock, orders and authorized resellers',
    admin_tab_dashboard: 'Dashboard',
    admin_tab_stock: 'Stars Stock',
    admin_tab_orders: 'Orders',
    admin_tab_resellers: 'Resellers',
    admin_total_revenue: 'Total Revenue',
    admin_total_orders: 'Total Orders',
    admin_total_resellers: 'Active Resellers',
    admin_total_stock: 'Available Stars Stock',
    admin_add_stock: 'Add Stock',
    admin_clear_stock: 'Clear Stock',
    admin_add_reseller: 'Add Reseller',
    admin_telegram_id_placeholder: 'Telegram User ID (e.g. 123456789)',
    admin_reseller_name_placeholder: 'Customer name / note',
    admin_discount_placeholder: 'Discount % (e.g. 20)',
    admin_stock_lines_placeholder: 'Paste accounts or serial keys here (one per line)...'
  }
};

const FRANCOPHONE_TIMEZONES = new Set([
  'Europe/Paris',
  'Europe/Brussels',
  'Europe/Zurich',
  'Europe/Monaco',
  'Europe/Luxembourg',
  'America/Montreal',
  'America/Toronto',
  'America/Cayenne',
  'America/Guadeloupe',
  'America/Martinique',
  'Africa/Casablanca',
  'Africa/Algiers',
  'Africa/Tunis',
  'Africa/Dakar',
  'Africa/Abidjan',
  'Africa/Douala',
  'Africa/Kinshasa',
  'Africa/Lubumbashi',
  'Africa/Libreville',
  'Africa/Brazzaville',
  'Africa/Bamako',
  'Africa/Niamey',
  'Africa/Ouagadougou',
  'Africa/Lome',
  'Africa/Cotonou',
  'Africa/Ndjamena',
  'Indian/Reunion',
  'Indian/Mayotte',
  'Indian/Antananarivo',
  'Pacific/Noumea',
  'Pacific/Tahiti'
]);

export function detectDefaultLanguage(telegramUser?: TelegramWebAppUser): Language {
  try {
    if (telegramUser?.language_code) {
      const code = telegramUser.language_code.toLowerCase();
      if (code.startsWith('fr')) {
        return 'fr';
      }
      return 'en';
    }

    if (typeof navigator !== 'undefined') {
      const navLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
      if (navLang.startsWith('fr')) {
        return 'fr';
      }
    }

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && FRANCOPHONE_TIMEZONES.has(tz)) {
        return 'fr';
      }
    } catch {}

    return 'en';
  } catch {
    return 'en';
  }
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: typeof translations['fr'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{
  children: React.ReactNode;
  telegramUser?: TelegramWebAppUser;
}> = ({ children, telegramUser }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('tekaz_lang');
      if (saved === 'fr' || saved === 'en') {
        return saved;
      }
    } catch {}
    return detectDefaultLanguage(telegramUser);
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tekaz_lang');
      if (!saved && telegramUser) {
        setLanguageState(detectDefaultLanguage(telegramUser));
      }
    } catch {}
  }, [telegramUser]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('tekaz_lang', lang);
    } catch {}
  };

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr');
  };

  const t = useMemo(() => translations[language], [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
