export interface SeoFaq {
  question: string;
  answer: string;
}

export interface SeoRelatedLink {
  label: string;
  href: string;
  description: string;
}

export interface SeoPageData {
  slug: string; // e.g. "mtn-data-bundles"
  path: string; // e.g. "/mtn-data-bundles"
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  h1: string;
  badge: string;
  category: string;
  categoryPath: string;
  targetCategory: string; // DATA_BUNDLES, BOOKING_CODES, RESULT_CHECKER, GAME_COINS, PC_GAMES, PREMIUM_APPS, STATIC
  targetTab?: string; // MTN, Telecel, AirtelTigo, FC_MOBILE, PUBG_MOBILE, FC_26, etc.
  leadText: string;
  overviewHeading: string;
  overviewParagraphs: string[];
  featuresHeading: string;
  features: { title: string; desc: string }[];
  howItWorksHeading: string;
  howItWorksSteps: { step: number; title: string; desc: string }[];
  guidelinesHeading: string;
  guidelines: string[];
  faqs: SeoFaq[];
  relatedLinks: SeoRelatedLink[];
}

export const SEO_PAGES: Record<string, SeoPageData> = {
  // ==========================================
  // 0. HOMEPAGE (PRIMARY STOREFRONT)
  // ==========================================
  "home": {
    slug: "",
    path: "/",
    metaTitle: "#1 Cheapest Data Bundles in Ghana | MTN, Telecel & AT | DATAGHANAnow",
    metaDescription: "Buy cheap MTN, Telecel and AT data bundles in Ghana at affordable prices. Enjoy competitive data deals, convenient Mobile Money payments and fast delivery with DATAGHANAnow.",
    canonicalUrl: "https://kingjdeals.site/",
    h1: "#1 Cheapest Data Bundles in Ghana | MTN, Telecel & AT",
    badge: "GHANA'S #1 DATA MARKETPLACE",
    category: "Home",
    categoryPath: "/",
    targetCategory: "DATA_BUNDLES",
    targetTab: "MTN",
    leadText: "Buy cheap MTN, Telecel, and AT (AirtelTigo) data bundles online in Ghana with fast digital delivery and easy Mobile Money payments.",
    overviewHeading: "Ghana's Premier Marketplace for Cheap Mobile Data",
    overviewParagraphs: [
      "DATAGHANAnow is Ghana's leading online marketplace for purchasing affordable mobile data bundles across MTN, Telecel (formerly Vodafone), and AirtelTigo (AT).",
      "Whether you are looking for non-expiry internet packages, daily data deals, wholesale data prices, or instant Mobile Money top-ups, DATAGHANAnow delivers fast, reliable service straight to your mobile phone number."
    ],
    featuresHeading: "Why Ghanaians Choose DATAGHANAnow",
    features: [
      { title: "Cheapest Market Prices", desc: "Access the most competitive rates for MTN, Telecel, and AT data packages in Ghana." },
      { title: "Instant Mobile Money Top-Up", desc: "Pay seamlessly using MTN MoMo, Telecel Cash, or AT Money with encrypted payment security." },
      { title: "Non-Expiry Data Packages", desc: "Enjoy data bundles that stay active until fully consumed, with no daily or monthly expiration." },
      { title: "Multi-Network Digital Convenience", desc: "Order data for any SIM card in Ghana in one easy-to-use digital marketplace." }
    ],
    howItWorksHeading: "How to Buy Cheap Data Online in Ghana",
    howItWorksSteps: [
      { step: 1, title: "Choose Network", desc: "Select MTN, Telecel, or AirtelTigo (AT) in the store tab." },
      { step: 2, title: "Select Data Volume", desc: "Pick your preferred gigabyte package and enter the recipient phone number." },
      { step: 3, title: "Pay via MoMo", desc: "Authorize payment using your Mobile Money wallet or bank card." },
      { step: 4, title: "Instant Crediting", desc: "Your data is dispatched straight to your phone line with SMS confirmation." }
    ],
    guidelinesHeading: "Ordering Best Practices",
    guidelines: [
      "Verify the recipient phone number before approving your Mobile Money prompt.",
      "Ensure your SIM line is active under Ghana National Communications Authority guidelines.",
      "Most orders process within 5 to 15 minutes under normal network operations."
    ],
    faqs: [
      { question: "Where can I buy the cheapest data bundles in Ghana?", answer: "DATAGHANAnow offers the cheapest mobile data bundles in Ghana across MTN, Telecel, and AirtelTigo (AT) with instant online ordering." },
      { question: "How much does 1GB of MTN data cost?", answer: "1GB of MTN data on DATAGHANAnow costs GH₵5.00 with instant Mobile Money delivery." },
      { question: "What is the price of 10GB MTN data?", answer: "10GB of MTN data on DATAGHANAnow costs GH₵50.00." },
      { question: "What is the smallest Telecel bundle available?", answer: "The smallest Telecel data bundle available on DATAGHANAnow is 10GB for GH₵40.00 (which is only GH₵4.00 per GB)." },
      { question: "How much does 10GB Telecel data cost?", answer: "10GB of Telecel data costs GH₵40.00 on DATAGHANAnow." },
      { question: "How much does AirtelTigo data cost?", answer: "AirtelTigo (AT) data bundles start at GH₵5.00 for 1GB up to GH₵40.00 for 8GB." },
      { question: "How do I pay for data on DATAGHANAnow?", answer: "You can pay using any Ghana Mobile Money wallet (MTN MoMo, Telecel Cash, AT Money) or debit card." },
      { question: "Do the data packages expire?", answer: "Most packages available on DATAGHANAnow are non-expiry bundles, allowing you to use your data at your own pace." }
    ],
    relatedLinks: [
      { label: "Cheap MTN Data Bundles", href: "/mtn-data-bundles", description: "Buy cheap MTN data bundles in Ghana." },
      { label: "Cheap Telecel Data Bundles", href: "/telecel-data-bundles", description: "Order Telecel mobile internet packages." },
      { label: "Cheap AT Data Bundles", href: "/airteltigo-data-bundles", description: "Get AirtelTigo data deals." },
      { label: "WAEC Results Checkers", href: "/results-checker", description: "Buy WASSCE, BECE, and NOVDEC checker cards." }
    ]
  },

  // ==========================================
  // 1. ALL DATA BUNDLES (CATEGORY)
  // ==========================================
  "data-bundles": {
    slug: "data-bundles",
    path: "/data-bundles",
    metaTitle: "Cheapest Data Bundles in Ghana | Compare MTN, Telecel & AT Prices - DATAGHANAnow",
    metaDescription: "Compare and buy the cheapest data bundles in Ghana across MTN, Telecel, and AirtelTigo. Enjoy non-expiry packages, wholesale rates, and fast Mobile Money delivery.",
    canonicalUrl: "https://kingjdeals.site/data-bundles",
    h1: "Compare & Buy Cheap Data Bundles in Ghana",
    badge: "ALL NETWORKS DATA DEALS",
    category: "Data Bundles",
    categoryPath: "/data-bundles",
    targetCategory: "DATA_BUNDLES",
    targetTab: "MTN",
    leadText: "Compare and order cheap mobile internet data packages across all Ghanaian networks with instant digital delivery.",
    overviewHeading: "Complete Data Bundle Comparison & Online Ordering",
    overviewParagraphs: [
      "DATAGHANAnow provides Ghanaian internet users, students, remote workers, and business owners with a centralized platform to compare and buy cheap data bundles online.",
      "Whether you are browsing on MTN, streaming on Telecel, or working on AirtelTigo (AT), our system enables fast, affordable top-ups."
    ],
    featuresHeading: "Why Order Data Bundles on DATAGHANAnow?",
    features: [
      { title: "All Major Networks", desc: "Access cheap data deals for MTN Ghana, Telecel Ghana, and AirtelTigo (AT) in one portal." },
      { title: "Wholesale & Retail Rates", desc: "Get maximum value for your money with low price points per gigabyte." },
      { title: "Mobile Money Convenience", desc: "Pay securely with MTN MoMo, Telecel Cash, or AT Money." },
      { title: "Non-Expiry Flexibility", desc: "Many data packages feature non-expiry validity so your data never goes to waste." }
    ],
    howItWorksHeading: "How to Order Mobile Data Online",
    howItWorksSteps: [
      { step: 1, title: "Select Network", desc: "Choose MTN, Telecel, or AirtelTigo depending on your SIM card." },
      { step: 2, title: "Select Package & Enter Number", desc: "Pick your preferred data volume and enter the 10-digit recipient phone number." },
      { step: 3, title: "Pay Securely", desc: "Complete payment via Mobile Money or debit card." },
      { step: 4, title: "Receive Your Data", desc: "Your data is dispatched straight to your phone line with network SMS confirmation." }
    ],
    guidelinesHeading: "Important Ordering Information",
    guidelines: [
      "Double-check your recipient phone number before completing checkout; data sent to an incorrect number cannot be reversed.",
      "Ensure your SIM card is active under Ghana NCA guidelines to receive network top-ups.",
      "Delivery typically takes between 5 to 15 minutes under standard network operating conditions."
    ],
    faqs: [
      { question: "Which mobile networks are supported in Ghana?", answer: "DATAGHANAnow supports all three licensed mobile network operators in Ghana: MTN Ghana, Telecel Ghana, and AirtelTigo (AT)." },
      { question: "Do the mobile data bundles have an expiry date?", answer: "Most packages offered on DATAGHANAnow are non-expiry packages, meaning the data remains valid until fully consumed." },
      { question: "How will I know when my data has been delivered?", answer: "You will receive an official notification SMS from your telecom operator confirming the data crediting to your account." },
      { question: "What payment methods can I use?", answer: "Payments are processed securely via Paystack and Korapay, supporting MTN MoMo, Telecel Cash, AT Money, and bank cards." }
    ],
    relatedLinks: [
      { label: "MTN Data Bundles", href: "/mtn-data-bundles", description: "Affordable internet packages for MTN Ghana users." },
      { label: "Telecel Data Bundles", href: "/telecel-data-bundles", description: "Reliable mobile data for Telecel Ghana SIMs." },
      { label: "AirtelTigo Data Bundles", href: "/airteltigo-data-bundles", description: "Value data bundles for AirtelTigo lines." },
      { label: "WAEC Results Checker", href: "/results-checker", description: "Buy WASSCE and BECE results checker cards." }
    ]
  },

  // ==========================================
  // 2. MTN DATA BUNDLES (SERVICE)
  // ==========================================
  "mtn-data-bundles": {
    slug: "mtn-data-bundles",
    path: "/mtn-data-bundles",
    metaTitle: "Cheapest MTN Data Bundles in Ghana | Best MTN Data Prices - DATAGHANAnow",
    metaDescription: "Buy cheap MTN data bundles in Ghana at the best prices. Fast online top-up directly to your MTN Ghana line with Mobile Money payment on DATAGHANAnow.",
    canonicalUrl: "https://kingjdeals.site/mtn-data-bundles",
    h1: "Cheapest MTN Data Bundles in Ghana",
    badge: "CHEAP MTN DATA GHANA",
    category: "Data Bundles",
    categoryPath: "/data-bundles",
    targetCategory: "DATA_BUNDLES",
    targetTab: "MTN",
    leadText: "Order cheap MTN Ghana internet data packages with fast online delivery straight to your mobile phone number.",
    overviewHeading: "Cheapest MTN Data for Everyday Internet in Ghana",
    overviewParagraphs: [
      "MTN is Ghana's largest and widest telecommunications network. Finding the cheapest MTN data top-ups should be quick and hassle-free.",
      "DATAGHANAnow offers affordable MTN data bundles online. Whether you need data for streaming, social media, remote work, or school, our platform makes buying MTN data simple and rapid."
    ],
    featuresHeading: "Key Benefits of Buying MTN Bundles on DATAGHANAnow",
    features: [
      { title: "Direct Number Crediting", desc: "No scratch cards needed; data is credited directly to the MTN number you specify." },
      { title: "Non-Expiry Flexibility", desc: "Enjoy MTN data bundles that do not expire, giving you full control over usage." },
      { title: "Instant MoMo Checkout", desc: "Quickly checkout with your MTN Mobile Money wallet with encrypted payment safety." },
      { title: "Round-the-Clock Ordering", desc: "Place orders 24/7 with automated dispatch queues ensuring prompt delivery." }
    ],
    howItWorksHeading: "How to Buy Cheap MTN Data Bundles",
    howItWorksSteps: [
      { step: 1, title: "Select MTN Package", desc: "Navigate to the store and choose your desired MTN gigabyte package." },
      { step: 2, title: "Enter Your MTN Number", desc: "Type your 10-digit MTN phone number (e.g., 024XXXXXXX or 059XXXXXXX)." },
      { step: 3, title: "Approve MoMo Prompt", desc: "Confirm the payment prompt on your MTN Mobile Money handset." },
      { step: 4, title: "Receive Confirmation", desc: "You will receive an official SMS from MTN confirming your newly added data balance." }
    ],
    guidelinesHeading: "MTN Ordering Guidelines",
    guidelines: [
      "Ensure your MTN SIM is active and registered under your Ghana Card.",
      "Verify that your phone number begins with valid MTN Ghana prefixes (024, 054, 055, 059, 053).",
      "Check your MTN balance anytime using the official USSD code *124# or *138#."
    ],
    faqs: [
      { question: "Where can I buy cheap MTN data in Ghana?", answer: "You can order the cheapest MTN data bundles online at DATAGHANAnow with instant MoMo top-up." },
      { question: "How much does 1GB of MTN data cost?", answer: "1GB of MTN data on DATAGHANAnow costs GH₵5.00." },
      { question: "What is the price of 10GB MTN data?", answer: "10GB of MTN data on DATAGHANAnow costs GH₵50.00." },
      { question: "What is the price of 30GB MTN data?", answer: "30GB of MTN data on DATAGHANAnow costs GH₵130.00 (which works out to only GH₵4.33 per GB)." },
      { question: "What is the cheapest MTN data bundle?", answer: "The cheapest MTN data bundle is 1GB for GH₵5.00. For larger capacities, 15GB costs GH₵70.00, 30GB costs GH₵130.00, and 100GB costs GH₵500.00." },
      { question: "Do these MTN bundles expire?", answer: "Most MTN packages available on DATAGHANAnow are non-expiry packages, allowing you to use them until the balance finishes." },
      { question: "Can I buy MTN data for someone else?", answer: "Yes. Simply input the recipient's MTN mobile number during checkout, and the data will be sent directly to their line." },
      { question: "How long does MTN data delivery take?", answer: "Delivery typically completes within 5 to 15 minutes after payment confirmation during operating hours." }
    ],
    relatedLinks: [
      { label: "All Data Bundles", href: "/data-bundles", description: "Compare MTN, Telecel, and AT options." },
      { label: "Telecel Data Bundles", href: "/telecel-data-bundles", description: "Check out Telecel mobile data packages." },
      { label: "AirtelTigo Data Bundles", href: "/airteltigo-data-bundles", description: "Browse AirtelTigo data options." },
      { label: "DATAGHANAnow Storefront", href: "/", description: "Return to the main store dashboard." }
    ]
  },

  // ==========================================
  // 3. TELECEL DATA BUNDLES (SERVICE)
  // ==========================================
  "telecel-data-bundles": {
    slug: "telecel-data-bundles",
    path: "/telecel-data-bundles",
    metaTitle: "Cheapest Telecel Data Bundles in Ghana | Best Prices - DATAGHANAnow",
    metaDescription: "Order cheap Telecel data bundles in Ghana at unbeatable rates. Fast digital delivery to your Telecel (Vodafone) number via Telecel Cash & MTN MoMo.",
    canonicalUrl: "https://kingjdeals.site/telecel-data-bundles",
    h1: "Cheapest Telecel Data Bundles in Ghana",
    badge: "CHEAP TELECEL DATA GHANA",
    category: "Data Bundles",
    categoryPath: "/data-bundles",
    targetCategory: "DATA_BUNDLES",
    targetTab: "Telecel",
    leadText: "Get fast, cheap Telecel Ghana mobile data packages delivered straight to your Telecel line.",
    overviewHeading: "Connect Seamlessly with Cheap Telecel Data in Ghana",
    overviewParagraphs: [
      "Telecel Ghana (formerly Vodafone Ghana) is renowned for solid high-speed 4G connectivity across Ghanaian towns and cities.",
      "DATAGHANAnow allows Telecel subscribers to conveniently order cheap mobile data packages online without dealing with voucher scratch codes."
    ],
    featuresHeading: "Why Get Telecel Bundles via DATAGHANAnow?",
    features: [
      { title: "Direct Line Crediting", desc: "Data is delivered electronically to your Telecel phone number." },
      { title: "Unbeatable Everyday Rates", desc: "Access high-volume Telecel data packages at low wholesale pricing." },
      { title: "Telecel Cash & MoMo Support", desc: "Pay using Telecel Cash, MTN MoMo, or standard debit cards." },
      { title: "Convenient Online Queue", desc: "Order anytime, anywhere from your phone or computer." }
    ],
    howItWorksHeading: "How to Order Telecel Data Online",
    howItWorksSteps: [
      { step: 1, title: "Select Telecel", desc: "Choose the Telecel tab in the DATAGHANAnow catalog." },
      { step: 2, title: "Enter Telecel Phone Number", desc: "Input your 10-digit number with standard Telecel prefixes (e.g., 020, 050)." },
      { step: 3, title: "Complete Payment", desc: "Authorize payment via Telecel Cash or your preferred Mobile Money wallet." },
      { step: 4, title: "Confirmation SMS", desc: "Telecel will dispatch an official network SMS confirming your updated data volume." }
    ],
    guidelinesHeading: "Telecel Guidelines",
    guidelines: [
      "Ensure your SIM is active with Telecel Ghana prefixes (020, 050).",
      "Check your Telecel balance using the official USSD shortcode *124# or *126#.",
      "Verify the recipient phone number accurately before proceeding to payment."
    ],
    faqs: [
      { question: "Where can I buy cheap Telecel data in Ghana?", answer: "DATAGHANAnow provides affordable Telecel mobile data top-ups with instant digital delivery." },
      { question: "What is the smallest Telecel bundle available?", answer: "The smallest active Telecel data bundle available on DATAGHANAnow is 10GB for GH₵40.00 (which is an exceptional rate of GH₵4.00 per GB)." },
      { question: "How much does 10GB Telecel data cost?", answer: "10GB of Telecel data costs GH₵40.00 on DATAGHANAnow." },
      { question: "What is the price of 30GB Telecel data?", answer: "30GB of Telecel data costs GH₵115.00 on DATAGHANAnow (GH₵3.83 per GB)." },
      { question: "What is the price of 100GB Telecel data?", answer: "100GB of Telecel data costs GH₵355.00 on DATAGHANAnow (GH₵3.55 per GB)." },
      { question: "Is Telecel formerly Vodafone Ghana?", answer: "Yes, Vodafone Ghana was rebranded to Telecel Ghana. All 020 and 050 numbers operate on Telecel." },
      { question: "How long does Telecel delivery take?", answer: "Most orders are delivered within 5 to 15 minutes during regular operating hours." }
    ],
    relatedLinks: [
      { label: "Data Bundles Overview", href: "/data-bundles", description: "View all mobile network options." },
      { label: "MTN Data Bundles", href: "/mtn-data-bundles", description: "Explore MTN internet bundles." },
      { label: "AirtelTigo Data Bundles", href: "/airteltigo-data-bundles", description: "Check AirtelTigo packages." }
    ]
  },

  // ==========================================
  // 4. AIRTELTIGO DATA BUNDLES (SERVICE)
  // ==========================================
  "airteltigo-data-bundles": {
    slug: "airteltigo-data-bundles",
    path: "/airteltigo-data-bundles",
    metaTitle: "Cheapest AT Data Bundles in Ghana | Best AirtelTigo Prices - DATAGHANAnow",
    metaDescription: "Buy cheap AirtelTigo (AT) data bundles online in Ghana. Get high-value non-expiry AT data packages with fast Mobile Money delivery on DATAGHANAnow.",
    canonicalUrl: "https://kingjdeals.site/airteltigo-data-bundles",
    h1: "Cheapest AirtelTigo (AT) Data Bundles in Ghana",
    badge: "CHEAP AIRTELTIGO / AT DATA",
    category: "Data Bundles",
    categoryPath: "/data-bundles",
    targetCategory: "DATA_BUNDLES",
    targetTab: "AirtelTigo",
    leadText: "Enjoy value-packed mobile internet data on AirtelTigo (AT) Ghana with instant online order processing.",
    overviewHeading: "Great Value & Non-Expiry Internet on the AT Network",
    overviewParagraphs: [
      "AirtelTigo (AT) offers some of the most generous data allocations in Ghana, making it a favorite for heavy downloaders, streamers, and mobile entrepreneurs.",
      "On DATAGHANAnow, buying AT data is cheap, secure, and delivered directly to your AirtelTigo number."
    ],
    featuresHeading: "Why Choose AT Data on DATAGHANAnow?",
    features: [
      { title: "High Value Allocation", desc: "Maximize your internet browsing with substantial data volumes per cedi." },
      { title: "Non-Expiry Freedom", desc: "AT packages offer non-expiry flexibility for prolonged usage." },
      { title: "Fast Digital Delivery", desc: "Credited straight to your phone line without extra hassle." },
      { title: "Universal Payment", desc: "Pay with AT Money, MTN MoMo, Telecel Cash, or debit cards." }
    ],
    howItWorksHeading: "Steps to Buy AirtelTigo (AT) Data",
    howItWorksSteps: [
      { step: 1, title: "Choose AT Network", desc: "Navigate to the AirtelTigo tab in the store." },
      { step: 2, title: "Select Package & Enter Number", desc: "Type your 10-digit AT number (prefixes 027, 057, 026, 056)." },
      { step: 3, title: "Approve Payment", desc: "Complete payment via Mobile Money or card." },
      { step: 4, title: "Receive Data", desc: "Check your balance via *124# or *111# upon receiving your confirmation SMS." }
    ],
    guidelinesHeading: "AirtelTigo Guidelines",
    guidelines: [
      "Confirm your SIM is active with AT prefixes (027, 057, 026, 056).",
      "Check your balance using the official USSD shortcode *124# or *111#."
    ],
    faqs: [
      { question: "Is AirtelTigo now known as AT?", answer: "Yes, AirtelTigo officially rebranded to 'AT' in Ghana. Both names refer to the same network." },
      { question: "Where can I buy cheap AT data bundles in Ghana?", answer: "DATAGHANAnow offers cheap AirtelTigo (AT) data bundles with instant delivery via Mobile Money." },
      { question: "How much does 1GB AirtelTigo data cost?", answer: "1GB of AirtelTigo (AT) data costs GH₵5.00 on DATAGHANAnow." },
      { question: "How much does 5GB AirtelTigo data cost?", answer: "5GB of AirtelTigo data costs GH₵25.00 on DATAGHANAnow." },
      { question: "How much does 8GB AirtelTigo data cost?", answer: "8GB of AirtelTigo data costs GH₵40.00 on DATAGHANAnow." },
      { question: "How fast is delivery?", answer: "Delivery usually completes within 5 to 15 minutes." }
    ],
    relatedLinks: [
      { label: "All Data Bundles", href: "/data-bundles", description: "View all network offerings." },
      { label: "MTN Data Bundles", href: "/mtn-data-bundles", description: "Explore MTN packages." },
      { label: "Telecel Data Bundles", href: "/telecel-data-bundles", description: "Explore Telecel packages." }
    ]
  },

  // ==========================================
  // 5. RESULTS CHECKER (CATEGORY)
  // ==========================================
  "results-checker": {
    slug: "results-checker",
    path: "/results-checker",
    metaTitle: "Buy WAEC Results Checker Online in Ghana | WASSCE, BECE & NOVDEC - DATAGHANAnow",
    metaDescription: "Buy authentic WAEC Ghana result checker PINs and Serials for WASSCE, BECE, and NOVDEC. Instant online delivery for WAEC Direct result verification.",
    canonicalUrl: "https://kingjdeals.site/results-checker",
    h1: "Buy WAEC Results Checkers Online in Ghana",
    badge: "EXAM RESULTS CHECKERS",
    category: "Result Checker",
    categoryPath: "/results-checker",
    targetCategory: "RESULT_CHECKER",
    targetTab: "Result Checker",
    leadText: "Buy genuine WAEC examination results checker PINs and Serial numbers online with instant digital delivery.",
    overviewHeading: "Instant Access to Official WAEC Examination Results",
    overviewParagraphs: [
      "Every year, thousands of Ghanaian students, parents, and guardians eagerly anticipate the release of national examination results from the West African Examinations Council (WAEC).",
      "DATAGHANAnow provides a fast, reliable, and secure online platform to purchase official WAEC Result Checker PINs and Serials for WASSCE (School and Private), BECE, and NOVDEC without having to hunt for physical cards at internet cafés."
    ],
    featuresHeading: "Why Purchase Results Checkers on DATAGHANAnow?",
    features: [
      { title: "Instant Delivery", desc: "Receive your Serial number and PIN on-screen and in your account immediately after payment." },
      { title: "Authentic WAEC Serials", desc: "100% valid PINs compatible with the official WAEC Ghana Direct portal (ghana.waecdirect.org)." },
      { title: "School Placement Ready", desc: "Use your BECE PIN to check both your exam results and CSSPS senior high school placement." },
      { title: "Mobile Money Friendly", desc: "Easily pay with any Ghanaian Mobile Money wallet or debit card." }
    ],
    howItWorksHeading: "How to Buy & Use Your Checker",
    howItWorksSteps: [
      { step: 1, title: "Select Exam Type", desc: "Choose WASSCE, BECE, or NOVDEC based on the examination you sat for." },
      { step: 2, title: "Provide Contact Info", desc: "Enter your phone number or email to receive your voucher details." },
      { step: 3, title: "Pay Online", desc: "Complete the transaction using Mobile Money or bank card." },
      { step: 4, title: "Check on WAEC Portal", desc: "Visit ghana.waecdirect.org, enter your Index Number, Exam Year, Serial, and PIN to view results." }
    ],
    guidelinesHeading: "WAEC Portal Guidelines",
    guidelines: [
      "A standard WAEC results checker voucher allows checking a single candidate's result up to the limit allowed by WAEC (typically up to 3-5 times).",
      "Ensure you enter the correct 10-digit Index Number and appropriate Examination Year.",
      "Check your results strictly on the official WAEC website: ghana.waecdirect.org."
    ],
    faqs: [
      { question: "How do I receive my checker card after payment?", answer: "Your Serial number and PIN are displayed immediately on the screen and stored in your order history." },
      { question: "Can one voucher check multiple candidates?", answer: "No. A results checker voucher is tied to one candidate's index number once used." },
      { question: "Does the PIN expire?", answer: "WAEC vouchers remain valid for the specified examination session until the allowed usage count is exhausted." }
    ],
    relatedLinks: [
      { label: "WASSCE Results Checker", href: "/wassce-results-checker", description: "Buy WASSCE examination cards online." },
      { label: "BECE Results Checker", href: "/bece-results-checker", description: "Check junior high exam results and placement." },
      { label: "NOVDEC Results Checker", href: "/novdec-results-checker", description: "Check private candidate WAEC scores." },
      { label: "Mobile Data Bundles", href: "/data-bundles", description: "Stay connected while checking your results." }
    ]
  },

  // ==========================================
  // 6. WASSCE RESULTS CHECKER (SERVICE)
  // ==========================================
  "wassce-results-checker": {
    slug: "wassce-results-checker",
    path: "/wassce-results-checker",
    metaTitle: "Buy WASSCE Results Checker PIN Online Ghana | Official WAEC - DATAGHANAnow",
    metaDescription: "Purchase official WASSCE results checker PIN and Serial number online in Ghana. Instant delivery to check your Senior High School WAEC scores on ghana.waecdirect.org.",
    canonicalUrl: "https://kingjdeals.site/wassce-results-checker",
    h1: "Buy WASSCE Results Checker Card Online",
    badge: "WASSCE WAEC CHECKER",
    category: "Result Checker",
    categoryPath: "/results-checker",
    targetCategory: "RESULT_CHECKER",
    targetTab: "Result Checker",
    leadText: "Get authentic WAEC WASSCE results checker PINs and Serials delivered instantly online.",
    overviewHeading: "Check Your WASSCE Results Without Stress",
    overviewParagraphs: [
      "The West African Senior School Certificate Examination (WASSCE) is the decisive academic milestone for senior high school candidates across Ghana.",
      "When WAEC announces the provisional release of WASSCE results, traffic surges and physical scratch cards become scarce. DATAGHANAnow lets you buy your genuine WASSCE checker card online in seconds from your smartphone."
    ],
    featuresHeading: "WASSCE Checker Highlights",
    features: [
      { title: "Instant Serial & PIN", desc: "No delays; your card details are generated immediately upon verified payment." },
      { title: "Official WAEC Compatibility", desc: "Guaranteed authentic for checking results on ghana.waecdirect.org." },
      { title: "Affordable Pricing", desc: "Fair rates with no inflated internet cafe markups." },
      { title: "Mobile Money Accepted", desc: "Seamless checkout via MTN MoMo, Telecel Cash, or AT Money." }
    ],
    howItWorksHeading: "How to Check Your WASSCE Results",
    howItWorksSteps: [
      { step: 1, title: "Purchase Checker PIN", desc: "Order your WASSCE checker on DATAGHANAnow." },
      { step: 2, title: "Copy Serial & PIN", desc: "Copy the delivered Serial and PIN displayed on your order screen." },
      { step: 3, title: "Visit ghana.waecdirect.org", desc: "Enter your 10-digit Index Number, select 'WASSCE (School)' or 'WASSCE (Private)', and select your Exam Year." },
      { step: 4, title: "Submit & Print", desc: "Paste your Serial and PIN, then click Submit to view and print your result slip." }
    ],
    guidelinesHeading: "Important Checking Tips",
    guidelines: [
      "Double-check that your Index Number and Exam Year match what is printed on your admission notice or timetable.",
      "Save a digital copy or PDF of your statement of results immediately upon opening it.",
      "Do not share your PIN with unauthorized parties before you have successfully checked your result."
    ],
    faqs: [
      { question: "Where do I check my WASSCE results?", answer: "Visit the official WAEC Ghana website at https://ghana.waecdirect.org." },
      { question: "How many times can I view my result with one PIN?", answer: "WAEC typically allows checking a single candidate's result up to 3 to 5 times with one voucher." },
      { question: "Is this PIN for school candidates or private candidates?", answer: "Standard WASSCE vouchers work on the WAEC Direct portal for both school candidates and private candidates when selecting the matching exam type." }
    ],
    relatedLinks: [
      { label: "All Results Checkers", href: "/results-checker", description: "View BECE, WASSCE, and NOVDEC options." },
      { label: "BECE Results Checker", href: "/bece-results-checker", description: "Check Junior High School results." },
      { label: "NOVDEC Results Checker", href: "/novdec-results-checker", description: "Check Private Candidate results." }
    ]
  },

  // ==========================================
  // 7. BECE RESULTS CHECKER (SERVICE)
  // ==========================================
  "bece-results-checker": {
    slug: "bece-results-checker",
    path: "/bece-results-checker",
    metaTitle: "Buy BECE Results Checker PIN Ghana | CSSPS School Placement - DATAGHANAnow",
    metaDescription: "Buy genuine BECE results checker cards online in Ghana. Check Junior High School WAEC scores and CSSPS Senior High placement instantly with Mobile Money.",
    canonicalUrl: "https://kingjdeals.site/bece-results-checker",
    h1: "Buy BECE Results Checker & Placement PIN",
    badge: "BECE WAEC CHECKER",
    category: "Result Checker",
    categoryPath: "/results-checker",
    targetCategory: "RESULT_CHECKER",
    targetTab: "Result Checker",
    leadText: "Instant BECE results checker voucher PIN and Serial for junior high graduates and parents across Ghana.",
    overviewHeading: "Check BECE Scores and School Placement",
    overviewParagraphs: [
      "The Basic Education Certificate Examination (BECE) is the bridge to Senior High School and Technical Institutions across Ghana.",
      "DATAGHANAnow allows parents, teachers, and students to quickly buy genuine BECE Results Checker cards online, saving time and avoiding queues."
    ],
    featuresHeading: "Why Choose DATAGHANAnow for BECE Checkers?",
    features: [
      { title: "Immediate Voucher Access", desc: "Instant on-screen delivery of Serial and PIN." },
      { title: "CSSPS Compatible", desc: "Use the card details to check both scores and senior high placement." },
      { title: "Safe Mobile Payment", desc: "Pay securely via MTN MoMo, Telecel Cash, or AT Money." }
    ],
    howItWorksHeading: "How to Check BECE Results",
    howItWorksSteps: [
      { step: 1, title: "Buy Checker", desc: "Purchase a BECE checker on DATAGHANAnow." },
      { step: 2, title: "Go to WAEC Portal", desc: "Navigate to ghana.waecdirect.org." },
      { step: 3, title: "Enter Details", desc: "Input Index Number, select BECE (School or Private), and enter the Serial & PIN." },
      { step: 4, title: "View Results", desc: "Submit to access your grades and grade aggregate." }
    ],
    guidelinesHeading: "BECE Guidelines",
    guidelines: [
      "Have your 10-digit BECE Index Number ready.",
      "Ensure you select the exact year you sat for the BECE examination."
    ],
    faqs: [
      { question: "Can I use this checker for CSSPS school placement?", answer: "Yes, BECE results checker cards are frequently used in verifying candidate credentials on the placement system." },
      { question: "Is the voucher delivered immediately?", answer: "Yes, delivery is instantaneous upon confirmed Mobile Money payment." }
    ],
    relatedLinks: [
      { label: "Results Checker Hub", href: "/results-checker", description: "View all exam checker options." },
      { label: "WASSCE Results Checker", href: "/wassce-results-checker", description: "Check Senior High School results." },
      { label: "Data Bundles", href: "/data-bundles", description: "Ensure you have data to check your placement." }
    ]
  },

  // ==========================================
  // 8. NOVDEC RESULTS CHECKER (SERVICE)
  // ==========================================
  "novdec-results-checker": {
    slug: "novdec-results-checker",
    path: "/novdec-results-checker",
    metaTitle: "Buy NOVDEC Results Checker PIN Online Ghana | WAEC Private - DATAGHANAnow",
    metaDescription: "Buy official NOVDEC (WAEC Private Candidates) result checker PINs online in Ghana. Instant digital delivery for checking private WASSCE results.",
    canonicalUrl: "https://kingjdeals.site/novdec-results-checker",
    h1: "Buy NOVDEC Results Checker Card Online",
    badge: "WAEC PRIVATE CANDIDATES",
    category: "Result Checker",
    categoryPath: "/results-checker",
    targetCategory: "RESULT_CHECKER",
    targetTab: "Result Checker",
    leadText: "Purchase official WAEC NOVDEC / Private Candidate results checker PINs and Serials online.",
    overviewHeading: "Fast Results Checking for Private Candidates",
    overviewParagraphs: [
      "The November/December (NOVDEC) examinations cater to private candidates re-sitting or supplementing their senior high school subjects.",
      "With DATAGHANAnow, private candidates can conveniently order their official results checker cards online at any hour of the day."
    ],
    featuresHeading: "NOVDEC Checker Benefits",
    features: [
      { title: "24/7 Digital Availability", desc: "Buy your checker whenever results are released without leaving home." },
      { title: "Valid on WAEC Direct", desc: "100% genuine vouchers compatible with ghana.waecdirect.org." },
      { title: "MoMo Fast Checkout", desc: "Instant processing with all Ghana Mobile Money networks." }
    ],
    howItWorksHeading: "How to Access NOVDEC Results",
    howItWorksSteps: [
      { step: 1, title: "Purchase PIN", desc: "Order your NOVDEC voucher on DATAGHANAnow." },
      { step: 2, title: "Open WAEC Direct", desc: "Visit ghana.waecdirect.org on your browser." },
      { step: 3, title: "Select Private Exam", desc: "Select 'WASSCE (Private)' and enter your candidate Index Number." },
      { step: 4, title: "Submit Credentials", desc: "Enter your Serial and PIN to view your grades." }
    ],
    guidelinesHeading: "NOVDEC Guidelines",
    guidelines: [
      "Make sure you select 'WASSCE (Private)' as the examination type on the WAEC website.",
      "Check your index number carefully from your private candidate registration slip."
    ],
    faqs: [
      { question: "What is NOVDEC?", answer: "NOVDEC is the common name in Ghana for the WAEC West African Senior School Certificate Examination for Private Candidates." },
      { question: "Can I print my NOVDEC statement of result?", answer: "Yes, you can print or save your result as a PDF directly from the official WAEC portal." }
    ],
    relatedLinks: [
      { label: "All Results Checkers", href: "/results-checker", description: "Compare results checker options." },
      { label: "WASSCE Results Checker", href: "/wassce-results-checker", description: "View School WASSCE checker." },
      { label: "Data Bundles", href: "/data-bundles", description: "Get mobile data for browsing." }
    ]
  },

  // ==========================================
  // 9. BOOKING CODES (CATEGORY)
  // ==========================================
  "booking-codes": {
    slug: "booking-codes",
    path: "/booking-codes",
    metaTitle: "Sports Betting Booking Codes Ghana | SportyBet & Betway Accumulators - DATAGHANAnow",
    metaDescription: "Access daily sports betting booking codes for SportyBet, 1xBet, and Betway in Ghana. Curated football accumulator slips with instant code reveal.",
    canonicalUrl: "https://kingjdeals.site/booking-codes",
    h1: "Daily Sports Betting Booking Codes in Ghana",
    badge: "VIP & DAILY ACCUMULATORS",
    category: "Booking Codes",
    categoryPath: "/booking-codes",
    targetCategory: "BOOKING_CODES",
    targetTab: "Booking Codes",
    leadText: "Discover curated sports accumulator booking codes across popular Ghanaian sports betting platforms.",
    overviewHeading: "Curated Sports Bets & Match Selections",
    overviewParagraphs: [
      "Sports enthusiasts in Ghana frequently look for curated game selections, accumulator combinations, and daily analysis for football leagues across Europe and the globe.",
      "DATAGHANAnow features a booking codes service where users can unlock verified betting codes formatted for leading sportsbooks including SportyBet, 1xBet, Betway, MozzartBet, 22Bet, and Bet9ja."
    ],
    featuresHeading: "Booking Code Service Highlights",
    features: [
      { title: "Major Platform Support", desc: "Codes formatted for SportyBet, 1xBet, Betway, MozzartBet, 22Bet, and Bet9ja." },
      { title: "Instant Code Reveal", desc: "Codes are revealed immediately after completing checkout." },
      { title: "Daily Curated Selections", desc: "Selections analyzed for major European football leagues, tournaments, and cups." },
      { title: "One-Click Copy", desc: "Easily copy the code and paste it directly into your betting app or site." }
    ],
    howItWorksHeading: "How to Use DATAGHANAnow Booking Codes",
    howItWorksSteps: [
      { step: 1, title: "Browse Available Codes", desc: "Select the booking code category in our store and review currently available slips." },
      { step: 2, title: "Unlock Code", desc: "Complete payment to unlock your chosen booking slip." },
      { step: 3, title: "Copy Booking Code", desc: "Copy the revealed alphanumeric code directly to your clipboard." },
      { step: 4, title: "Load Slip in Sportsbook", desc: "Open your sportsbook app (e.g. SportyBet), tap 'Load Code', and paste to populate your betslip." }
    ],
    guidelinesHeading: "Responsible Gaming Notice",
    guidelines: [
      "Sports betting is strictly restricted to individuals aged 18 and older under the Gaming Act of Ghana.",
      "Booking codes are analytical game combinations and do not guarantee winnings. Bet responsibly and only with amounts you can afford to lose.",
      "Some booking codes may be subject to availability depending on active match schedules. Check the store for current active slips."
    ],
    faqs: [
      { question: "How do I load a booking code in SportyBet?", answer: "Open SportyBet, navigate to the Betslip, tap 'Load Bet Code', paste the code from DATAGHANAnow, and tap 'Load'." },
      { question: "Do booking codes expire?", answer: "Yes, booking codes expire as soon as the earliest match on the ticket kicks off." },
      { question: "Are winnings guaranteed?", answer: "No. Sports betting involves financial risk. DATAGHANAnow provides analytical selections but does not guarantee outcomes." }
    ],
    relatedLinks: [
      { label: "Mobile Data Bundles", href: "/data-bundles", description: "Get data to stream live sports matches." },
      { label: "Game Coins", href: "/game-coins", description: "Check in-game top-ups and digital currencies." },
      { label: "Home Storefront", href: "/", description: "Return to the main store." }
    ]
  },

  // ==========================================
  // 10. GAME COINS (CATEGORY)
  // ==========================================
  "game-coins": {
    slug: "game-coins",
    path: "/game-coins",
    metaTitle: "Buy Game Coins & Gaming Top-Ups Ghana | FC & PUBG Mobile - DATAGHANAnow",
    metaDescription: "Buy mobile game currencies in Ghana with Mobile Money. Instant top-ups for FC Mobile Points & Silver and PUBG Mobile UC delivered via Player ID.",
    canonicalUrl: "https://kingjdeals.site/game-coins",
    h1: "Buy Game Coins & Mobile Gaming Top-Ups in Ghana",
    badge: "MOBILE GAMING TOP-UPS",
    category: "Game Coins",
    categoryPath: "/game-coins",
    targetCategory: "GAME_COINS",
    targetTab: "Game Coins",
    leadText: "Top up your favorite mobile games with official in-game currencies using Ghanaian Mobile Money.",
    overviewHeading: "Level Up Your Mobile Gaming Experience",
    overviewParagraphs: [
      "Mobile esports and multiplayer gaming have exploded in popularity in Ghana, led by competitive titles like EA SPORTS FC Mobile and PUBG Mobile.",
      "However, purchasing in-game items through standard app store cards can be challenging due to foreign card restrictions. DATAGHANAnow simplifies top-ups by allowing Ghanaian gamers to pay with local Mobile Money."
    ],
    featuresHeading: "Gaming Top-Up Highlights",
    features: [
      { title: "Direct Player ID Top-Up", desc: "Credited straight to your player account using your in-game UID or character ID." },
      { title: "Popular Titles Covered", desc: "Top up FC Mobile Points & Silver or PUBG Mobile Unknown Cash (UC)." },
      { title: "Pay With Local MoMo", desc: "No international credit cards required; pay using MTN MoMo, Telecel Cash, or AT Money." },
      { title: "Fast Turnaround", desc: "Fast processing to get you back into the match with your new gear." }
    ],
    howItWorksHeading: "How to Order Game Coins",
    howItWorksSteps: [
      { step: 1, title: "Select Game", desc: "Choose EA SPORTS FC Mobile or PUBG Mobile in our store catalog." },
      { step: 2, title: "Choose Denomination", desc: "Pick your desired currency amount (Points, Silver, or UC)." },
      { step: 3, title: "Enter Player ID", desc: "Carefully paste your in-game Character ID / UID." },
      { step: 4, title: "Complete Checkout", desc: "Pay securely, and your currency is dispatched to your game profile." }
    ],
    guidelinesHeading: "Gamer Guidelines",
    guidelines: [
      "Always copy your Player ID directly from your game profile to prevent typographical errors.",
      "Ensure your game application is updated to the latest version.",
      "DATAGHANAnow will never ask for your game password or login credentials."
    ],
    faqs: [
      { question: "Do you need my game account password?", answer: "No. Top-ups only require your public Player ID / UID. Never share your game password." },
      { question: "How long does the top-up take to reflect?", answer: "In-game currencies usually reflect within 10 to 30 minutes after payment verification." }
    ],
    relatedLinks: [
      { label: "FC Mobile Points", href: "/fc-mobile-points", description: "Top up EA SPORTS FC Mobile Points and Silver." },
      { label: "PUBG Mobile UC", href: "/pubg-mobile-uc", description: "Buy Unknown Cash for PUBG Mobile." },
      { label: "PC Games", href: "/pc-games", description: "Explore full PC games like FC 26." }
    ]
  },

  // ==========================================
  // 11. FC MOBILE POINTS (SERVICE)
  // ==========================================
  "fc-mobile-points": {
    slug: "fc-mobile-points",
    path: "/fc-mobile-points",
    metaTitle: "Buy FC Mobile Points & Silver Ghana | EA SPORTS Top-Up - DATAGHANAnow",
    metaDescription: "Top up EA SPORTS FC Mobile Points and Silver in Ghana. Direct Player ID crediting with MTN MoMo, Telecel Cash, and AT Money on DATAGHANAnow.",
    canonicalUrl: "https://kingjdeals.site/fc-mobile-points",
    h1: "Buy EA SPORTS FC Mobile Points & Silver in Ghana",
    badge: "EA SPORTS FC MOBILE",
    category: "Game Coins",
    categoryPath: "/game-coins",
    targetCategory: "GAME_COINS",
    targetTab: "FC_MOBILE",
    leadText: "Upgrade your Ultimate Team with EA SPORTS FC Mobile Points and Silver delivered in Ghana.",
    overviewHeading: "Build Your Dream Squad on FC Mobile",
    overviewParagraphs: [
      "EA SPORTS FC Mobile lets football fans assemble their dream team with global superstars, participate in live events, and compete in Division Rivals.",
      "To open player packs, purchase event passes, and acquire Silver for upgrades, FC Points are essential. DATAGHANAnow provides Ghanaian players with a convenient way to top up using local payment options."
    ],
    featuresHeading: "FC Mobile Top-Up Perks",
    features: [
      { title: "Points & Silver Options", desc: "Choose between FC Points packs and Silver bundles." },
      { title: "UID Based Top-Up", desc: "Provide your public in-game UID to receive your crediting." },
      { title: "Mobile Money Accepted", desc: "Check out with MTN MoMo, Telecel Cash, or AT Money." },
      { title: "Safe & Verified", desc: "Zero risk to your team credentials; no password needed." }
    ],
    howItWorksHeading: "How to Top Up FC Mobile",
    howItWorksSteps: [
      { step: 1, title: "Select FC Package", desc: "Choose your preferred Points or Silver bundle in our store." },
      { step: 2, title: "Locate Your UID", desc: "Open FC Mobile, tap Settings, and copy your User ID (UID)." },
      { step: 3, title: "Enter UID & Pay", desc: "Paste your UID in the checkout form and complete payment." },
      { step: 4, title: "Restart App", desc: "Relaunch FC Mobile to see your updated Points/Silver balance." }
    ],
    guidelinesHeading: "FC Mobile Important Notes",
    guidelines: [
      "Double-check your UID from the in-game Settings menu.",
      "Keep your game linked to Google Play, Apple ID, or EA Account for safety."
    ],
    faqs: [
      { question: "Where do I find my FC Mobile UID?", answer: "Open FC Mobile, go to Settings (cog icon) in the top right, and your UID will be visible at the bottom." },
      { question: "Can I use FC Points to buy Star Pass?", answer: "Yes, FC Points can be used in-game to upgrade your Star Pass and unlock exclusive rewards." }
    ],
    relatedLinks: [
      { label: "All Game Coins", href: "/game-coins", description: "View all game top-up options." },
      { label: "PUBG Mobile UC", href: "/pubg-mobile-uc", description: "Buy PUBG Mobile Unknown Cash." },
      { label: "FC 26 PC Game", href: "/fc-26", description: "Get the full FC 26 PC version." }
    ]
  },

  // ==========================================
  // 12. PUBG MOBILE UC (SERVICE)
  // ==========================================
  "pubg-mobile-uc": {
    slug: "pubg-mobile-uc",
    path: "/pubg-mobile-uc",
    metaTitle: "Buy PUBG Mobile UC Ghana | Instant Unknown Cash Top-Up - DATAGHANAnow",
    metaDescription: "Buy PUBG Mobile UC (Unknown Cash) in Ghana at affordable rates. Instant Royale Pass and skin top-ups credited straight to your Player ID.",
    canonicalUrl: "https://kingjdeals.site/pubg-mobile-uc",
    h1: "Buy PUBG Mobile Unknown Cash (UC) in Ghana",
    badge: "PUBG MOBILE TOP-UP",
    category: "Game Coins",
    categoryPath: "/game-coins",
    targetCategory: "GAME_COINS",
    targetTab: "PUBG_MOBILE",
    leadText: "Get PUBG Mobile Unknown Cash (UC) delivered directly to your Player ID in Ghana.",
    overviewHeading: "Gear Up for the Battlegrounds",
    overviewParagraphs: [
      "PUBG Mobile is one of the premier battle royale titles enjoyed by gamers across Ghana. From high-stakes squad battles in Erangel to quick deathmatches, UC (Unknown Cash) is the currency needed to unlock premium crates, upgrade weapon skins, and activate the Royale Pass.",
      "DATAGHANAnow lets Ghanaian players buy PUBG Mobile UC directly using Mobile Money without needing an international bank card."
    ],
    featuresHeading: "PUBG Mobile UC Features",
    features: [
      { title: "Direct Player ID Delivery", desc: "No voucher redemption hassle; UC is credited directly to your Character ID." },
      { title: "Multiple UC Denominations", desc: "Select packages tailored for small upgrades or full Royale Pass unlocks." },
      { title: "Fast Turnaround", desc: "Prompt crediting to your account." },
      { title: "Pay With Ghana MoMo", desc: "Use MTN MoMo, Telecel Cash, or AT Money." }
    ],
    howItWorksHeading: "How to Buy PUBG Mobile UC",
    howItWorksSteps: [
      { step: 1, title: "Select UC Bundle", desc: "Pick your desired UC tier in our store." },
      { step: 2, title: "Copy Your Character ID", desc: "In PUBG Mobile, tap your avatar to find your numeric Character ID." },
      { step: 3, title: "Complete Payment", desc: "Pay via Mobile Money or card." },
      { step: 4, title: "Check In-Game Mail", desc: "Open PUBG Mobile to find your newly credited UC balance." }
    ],
    guidelinesHeading: "PUBG Mobile Tips",
    guidelines: [
      "Ensure you copy your numeric Character ID (e.g. 5123456789) rather than your display nickname.",
      "Check your server region to ensure compatibility with global top-up services."
    ],
    faqs: [
      { question: "Where do I find my PUBG Character ID?", answer: "Tap your profile avatar in the top-left corner of the main lobby. Your numerical Character ID is displayed next to your profile picture." },
      { question: "How much UC do I need for the Royale Pass?", answer: "Standard Elite Pass typically requires around 360 to 720 UC depending on the current active season." }
    ],
    relatedLinks: [
      { label: "Game Coins Hub", href: "/game-coins", description: "View all game currencies." },
      { label: "FC Mobile Points", href: "/fc-mobile-points", description: "Top up EA SPORTS FC Mobile." },
      { label: "Data Bundles", href: "/data-bundles", description: "Get high-speed data for gaming." }
    ]
  },

  // ==========================================
  // 13. PC GAMES (CATEGORY)
  // ==========================================
  "pc-games": {
    slug: "pc-games",
    path: "/pc-games",
    metaTitle: "PC Games Download Ghana | Direct Cloud Setup Files - DATAGHANAnow",
    metaDescription: "Download full PC games and offline setup packages in Ghana. Fast high-speed cloud repository access with step-by-step installation guides on DATAGHANAnow.",
    canonicalUrl: "https://kingjdeals.site/pc-games",
    h1: "PC Games Digital Downloads & Offline Setups in Ghana",
    badge: "PC GAMING INSTALLATIONS",
    category: "PC Games",
    categoryPath: "/pc-games",
    targetCategory: "PC_GAMES",
    targetTab: "PC Games",
    leadText: "Discover popular PC titles and offline digital setup packages available in Ghana.",
    overviewHeading: "PC Gaming Made Accessible in Ghana",
    overviewParagraphs: [
      "Downloading massive multi-gigabyte modern PC games in Ghana can be challenging due to unstable connections or limited international payment methods.",
      "DATAGHANAnow features PC game digital packages with high-speed cloud links (including dedicated Mega.nz repositories) and clear offline installation guidance."
    ],
    featuresHeading: "Why Get PC Games on DATAGHANAnow?",
    features: [
      { title: "High-Speed Direct Links", desc: "Access full game files hosted on resilient cloud servers with resume support." },
      { title: "Complete Setup Files", desc: "Includes installation files, patches, and step-by-step setup notes." },
      { title: "Dedicated Download Hub", desc: "Delivered directly into your DATAGHANAnow customer account upon verification." },
      { title: "Local Mobile Money", desc: "Pay with MTN MoMo, Telecel Cash, or AT Money." }
    ],
    howItWorksHeading: "How to Access PC Games",
    howItWorksSteps: [
      { step: 1, title: "Browse Catalog", desc: "Select your desired title from the PC Games section." },
      { step: 2, title: "Checkout", desc: "Complete the simple payment via Mobile Money or card." },
      { step: 3, title: "Access Download Page", desc: "Your order automatically unlocks your secure download repository link." },
      { step: 4, title: "Install & Play", desc: "Download the files and follow the straightforward setup instructions." }
    ],
    guidelinesHeading: "PC System Guidelines",
    guidelines: [
      "Check your computer's hardware specifications (CPU, GPU, RAM, Storage) before purchasing to ensure compatibility.",
      "Ensure you have sufficient free hard drive space (SSD recommended) for extracting and installing large game files."
    ],
    faqs: [
      { question: "How do I download the game after purchasing?", answer: "Once your order is verified, your DATAGHANAnow account unlocks a dedicated cloud repository link with all setup parts." },
      { question: "Do I need a strong internet connection?", answer: "Yes, modern PC games are several gigabytes in size. We recommend an unlimited or high-volume data bundle." }
    ],
    relatedLinks: [
      { label: "FC 26 PC Game", href: "/fc-26", description: "View EA SPORTS FC 26 PC details." },
      { label: "Data Bundles", href: "/data-bundles", description: "Get high-capacity data bundles for downloading." },
      { label: "Game Coins", href: "/game-coins", description: "Check mobile gaming top-ups." }
    ]
  },

  // ==========================================
  // 14. FC 26 (SERVICE)
  // ==========================================
  "fc-26": {
    slug: "fc-26",
    path: "/fc-26",
    metaTitle: "EA SPORTS FC 26 PC Download Ghana | Full Setup Files - DATAGHANAnow",
    metaDescription: "Download EA SPORTS FC 26 PC game in Ghana with direct cloud links, complete installation files, updated rosters, and setup instructions.",
    canonicalUrl: "https://kingjdeals.site/fc-26",
    h1: "Download EA SPORTS FC 26 PC Game in Ghana",
    badge: "FC 26 PC EDITION",
    category: "PC Games",
    categoryPath: "/pc-games",
    targetCategory: "PC_GAMES",
    targetTab: "FC_26",
    leadText: "Get full setup files and installation access for EA SPORTS FC 26 on PC in Ghana.",
    overviewHeading: "The World's Game on Your PC",
    overviewParagraphs: [
      "EA SPORTS FC 26 represents the pinnacle of football simulation gaming, featuring hyper-realistic player motion, authentic club kits, updated squads, and deep Career Mode gameplay.",
      "DATAGHANAnow provides PC football gamers in Ghana with direct cloud repository access to the complete installation files, making it easy to download and install on compatible Windows PCs."
    ],
    featuresHeading: "FC 26 PC Package Features",
    features: [
      { title: "Full Game Setup", desc: "Complete installation files with latest player rosters and kits." },
      { title: "Direct Cloud Repository", desc: "Fast download links hosted on Mega.nz with pause and resume support." },
      { title: "Step-by-Step Guide", desc: "Includes installation instructions to help you get the game running smoothly." },
      { title: "Ghana MoMo Payment", desc: "Pay easily using MTN MoMo, Telecel Cash, or AT Money." }
    ],
    howItWorksHeading: "How to Get FC 26 on PC",
    howItWorksSteps: [
      { step: 1, title: "Order FC 26", desc: "Select FC 26 in the DATAGHANAnow PC Games section." },
      { step: 2, title: "Complete Payment", desc: "Pay with your Mobile Money wallet or card." },
      { step: 3, title: "Access Download Portal", desc: "Your account immediately reveals the cloud download link." },
      { step: 4, title: "Install on PC", desc: "Download the setup archive, extract, and launch the installer." }
    ],
    guidelinesHeading: "Recommended System Specs",
    guidelines: [
      "Operating System: 64-bit Windows 10 or Windows 11.",
      "Processor: Intel Core i5 / AMD Ryzen 5 or higher.",
      "Memory: 8 GB to 16 GB RAM.",
      "Graphics: Dedicated DirectX 12 compatible graphics card (NVIDIA GTX 1050Ti / AMD Radeon RX 570 or better)."
    ],
    faqs: [
      { question: "Is this for Windows PC or consoles?", answer: "This package is specifically for Windows desktop and laptop PCs." },
      { question: "How large is the download?", answer: "The installation package is substantial (typically 40+ GB). Ensure you have sufficient data and disk space." },
      { question: "Can I use a controller/gamepad?", answer: "Yes, FC 26 supports Xbox, PlayStation, and generic USB controllers on PC." }
    ],
    relatedLinks: [
      { label: "All PC Games", href: "/pc-games", description: "Explore the PC Games section." },
      { label: "FC Mobile Points", href: "/fc-mobile-points", description: "Top up FC Mobile on your phone." },
      { label: "Data Bundles", href: "/data-bundles", description: "Get data bundles to download your game." }
    ]
  },

  // ==========================================
  // 15. PREMIUM APPS (CATEGORY)
  // ==========================================
  "premium-apps": {
    slug: "premium-apps",
    path: "/premium-apps",
    metaTitle: "Premium Digital Subscriptions & App Upgrades Ghana | DATAGHANAnow",
    metaDescription: "Explore digital subscriptions and app upgrades in Ghana with local Mobile Money payments. Streamlined account services on DATAGHANAnow.",
    canonicalUrl: "https://kingjdeals.site/premium-apps",
    h1: "Premium Digital Subscriptions & App Services",
    badge: "DIGITAL LIFESTYLE & APPS",
    category: "Premium Apps",
    categoryPath: "/premium-apps",
    targetCategory: "PREMIUM_APPS",
    targetTab: "Premium Apps",
    leadText: "Information and updates regarding digital entertainment subscriptions and premium services in Ghana.",
    overviewHeading: "Convenient Access to Digital Entertainment",
    overviewParagraphs: [
      "Modern digital life revolves around streaming music, binge-watching series, and using premium social features. However, many global subscription platforms require foreign credit cards that are difficult to obtain in Ghana.",
      "DATAGHANAnow is expanding its catalog to bridge this gap. Our upcoming Premium Apps section is designed to introduce convenient, local Mobile Money payment solutions for popular digital lifestyle services."
    ],
    featuresHeading: "Upcoming Digital Services Focus",
    features: [
      { title: "Music & Streaming", desc: "Potential subscription options for music streaming platforms like Audiomack and video platforms." },
      { title: "Social Upgrades", desc: "Informative support for services such as Snapchat+ and related lifestyle upgrades." },
      { title: "MoMo Powered", desc: "Designed around Ghanaian Mobile Money wallets for straightforward, local payment." },
      { title: "Strict Verification", desc: "Every service offered on DATAGHANAnow undergoes strict operational checks prior to listing." }
    ],
    howItWorksHeading: "How Digital Services Will Work",
    howItWorksSteps: [
      { step: 1, title: "Service Announcement", desc: "Check this page and our store announcements for officially activated app subscriptions." },
      { step: 2, title: "Select Tier", desc: "Pick your desired subscription length or service upgrade tier." },
      { step: 3, title: "Provide Account/ID", desc: "Submit the required account handle or email identifier." },
      { step: 4, title: "Activation Confirmation", desc: "Receive activation confirmation directly via SMS or email." }
    ],
    guidelinesHeading: "Availability Notice",
    guidelines: [
      "Digital app subscriptions are being added progressively. Services will only show as purchasable when fully tested and operationally ready.",
      "DATAGHANAnow does not claim official representation or partnership with third-party app developers unless explicitly verified.",
      "Please refer to the active storefront tabs to see currently purchasable items."
    ],
    faqs: [
      { question: "Which premium apps are coming to DATAGHANAnow?", answer: "We are actively exploring options for music streaming, social media upgrades (like Snapchat+), and popular digital lifestyle subscriptions." },
      { question: "Can I currently purchase premium apps?", answer: "Please check the 'Premium Apps' tab inside the DATAGHANAnow store to view any active listings. Products will only be enabled when operational." }
    ],
    relatedLinks: [
      { label: "Mobile Data Bundles", href: "/data-bundles", description: "Stream your favorite apps with affordable data." },
      { label: "Game Coins", href: "/game-coins", description: "Check in-game currencies for mobile games." },
      { label: "DATAGHANAnow Store", href: "/", description: "Return to the main store dashboard." }
    ]
  },

  // ==========================================
  // 16. ABOUT PAGE (STATIC)
  // ==========================================
  "about": {
    slug: "about",
    path: "/about",
    metaTitle: "About DATAGHANAnow | Ghana's Affordable Digital Data Marketplace",
    metaDescription: "Learn about DATAGHANAnow, Ghana's premier online marketplace for affordable mobile data bundles, WAEC result checkers, game coins, and digital services.",
    canonicalUrl: "https://kingjdeals.site/about",
    h1: "About DATAGHANAnow",
    badge: "COMPANY & IDENTITY",
    category: "About",
    categoryPath: "/about",
    targetCategory: "STATIC",
    leadText: "DATAGHANAnow is Ghana's trusted digital vendor for cheap mobile internet data, WAEC checkers, game top-ups, and digital lifestyle products.",
    overviewHeading: "Empowering Ghanaians with Affordable Digital Access",
    overviewParagraphs: [
      "Founded to solve the hassle of purchasing mobile data and digital vouchers, DATAGHANAnow connects customers across Ghana to reliable, budget-friendly digital services.",
      "We support all major Ghanaian telecommunications operators (MTN Ghana, Telecel Ghana, AirtelTigo/AT) and offer fast Mobile Money checkout."
    ],
    featuresHeading: "Core Values of DATAGHANAnow",
    features: [
      { title: "Affordability First", desc: "Providing low prices and high value across all mobile data and digital products." },
      { title: "Customer Security", desc: "Encrypted transactions processed via Ghana's leading licensed payment gateways." },
      { title: "Fast Digital Delivery", desc: "Automated fulfillment queues to deliver top-ups promptly." }
    ],
    howItWorksHeading: "How We Support Our Customers",
    howItWorksSteps: [
      { step: 1, title: "24/7 Digital Platform", desc: "Our store is accessible anytime from desktop or mobile." },
      { step: 2, title: "Dedicated Support", desc: "Reach our customer service team via WhatsApp or phone for order assistance." }
    ],
    guidelinesHeading: "Operational Standards",
    guidelines: [
      "DATAGHANAnow operates as an independent digital reseller.",
      "All trademarks belong to their respective telecommunications and examination body owners."
    ],
    faqs: [
      { question: "What is DATAGHANAnow?", answer: "DATAGHANAnow is an online marketplace in Ghana providing cheap mobile data bundles, WAEC checkers, and gaming currencies." }
    ],
    relatedLinks: [
      { label: "Mobile Data Bundles", href: "/data-bundles", description: "Buy cheap MTN, Telecel, and AT data." },
      { label: "Contact Us", href: "/contact", description: "Get in touch with customer support." }
    ]
  },

  // ==========================================
  // 17. CONTACT PAGE (STATIC)
  // ==========================================
  "contact": {
    slug: "contact",
    path: "/contact",
    metaTitle: "Contact Customer Support | DATAGHANAnow Ghana",
    metaDescription: "Get fast customer support for DATAGHANAnow data bundles, order tracking, and digital top-ups via WhatsApp and phone.",
    canonicalUrl: "https://kingjdeals.site/contact",
    h1: "Contact DATAGHANAnow Customer Support",
    badge: "CUSTOMER HELPDESK",
    category: "Contact",
    categoryPath: "/contact",
    targetCategory: "STATIC",
    leadText: "Need assistance with an order or product inquiry? Contact the DATAGHANAnow support team via WhatsApp or phone call.",
    overviewHeading: "We Are Here to Help",
    overviewParagraphs: [
      "Whether you have a question about an MTN, Telecel, or AT data top-up, need help checking a WAEC result voucher, or want to track an active order, our dedicated customer service team is ready to assist.",
      "Reach out through our official WhatsApp lines or call support directly."
    ],
    featuresHeading: "Support Channels",
    features: [
      { title: "WhatsApp Customer Care", desc: "Direct message support on 0535884851 or 0541557530 for fast resolution." },
      { title: "Phone Support Call", desc: "Call 0535884851 / 0541557530 during standard business hours." },
      { title: "Online Order Tracker", desc: "Track your order status live anytime on our website or USSD channel." }
    ],
    howItWorksHeading: "How to Request Order Assistance",
    howItWorksSteps: [
      { step: 1, title: "Locate Reference", desc: "Copy your Order Reference number (e.g. DGN-AIRTIME-...) from your order screen." },
      { step: 2, title: "Message Support", desc: "Send your reference number and recipient phone number to our WhatsApp support." }
    ],
    guidelinesHeading: "Support Operating Hours",
    guidelines: [
      "WhatsApp & Phone Support: 7:00 AM – 10:00 PM daily.",
      "Online store and automated USSD ordering remains active 24/7."
    ],
    faqs: [
      { question: "What is the official DATAGHANAnow WhatsApp number?", answer: "Our customer support WhatsApp numbers are 0535884851 and 0541557530." }
    ],
    relatedLinks: [
      { label: "Home Storefront", href: "/", description: "Return to main shop." },
      { label: "Data Bundles", href: "/data-bundles", description: "Explore mobile data deals." }
    ]
  },

  // ==========================================
  // 18. PRIVACY POLICY (STATIC)
  // ==========================================
  "privacy": {
    slug: "privacy",
    path: "/privacy",
    metaTitle: "Privacy Policy | DATAGHANAnow Data Protection & Safety",
    metaDescription: "Read the official DATAGHANAnow Privacy Policy. Learn how we securely handle customer numbers, payment references, and account information.",
    canonicalUrl: "https://kingjdeals.site/privacy",
    h1: "DATAGHANAnow Privacy Policy",
    badge: "DATA PRIVACY & PROTECTION",
    category: "Privacy Policy",
    categoryPath: "/privacy",
    targetCategory: "STATIC",
    leadText: "Your privacy and data security are paramount at DATAGHANAnow. Read our policy on data handling and user protection.",
    overviewHeading: "How DATAGHANAnow Handles Customer Information",
    overviewParagraphs: [
      "DATAGHANAnow collects only essential information required to process mobile data top-ups, deliver digital vouchers, and verify Mobile Money payments.",
      "We never store sensitive banking PINs or sell customer contact information to third-party marketers."
    ],
    featuresHeading: "Key Privacy Standards",
    features: [
      { title: "Encrypted Transactions", desc: "All payment transactions are encrypted using HTTPS and verified via licensed gateways." },
      { title: "Minimal Data Retention", desc: "We store only recipient phone numbers, order references, and transaction logs necessary for customer support." }
    ],
    howItWorksHeading: "Information Use",
    howItWorksSteps: [
      { step: 1, title: "Order Dispatch", desc: "Phone numbers are transmitted securely to telecom operators for data crediting." },
      { step: 2, title: "Verification", desc: "Payment references are verified against Paystack/Korapay gateway callbacks." }
    ],
    guidelinesHeading: "Customer Rights",
    guidelines: [
      "Customers may request account deletion or data inquiry through customer support."
    ],
    faqs: [
      { question: "Is my personal data safe on DATAGHANAnow?", answer: "Yes. We strictly adhere to industry privacy standards and encrypted data storage." }
    ],
    relatedLinks: [
      { label: "Terms of Service", href: "/terms", description: "Review terms and conditions." },
      { label: "Home Storefront", href: "/", description: "Return to home page." }
    ]
  },

  // ==========================================
  // 19. TERMS OF SERVICE (STATIC)
  // ==========================================
  "terms": {
    slug: "terms",
    path: "/terms",
    metaTitle: "Terms of Service | DATAGHANAnow Ordering & Usage Rules",
    metaDescription: "Review the official Terms of Service for DATAGHANAnow mobile data purchases, delivery timelines, and customer account usage.",
    canonicalUrl: "https://kingjdeals.site/terms",
    h1: "DATAGHANAnow Terms of Service",
    badge: "TERMS & CONDITIONS",
    category: "Terms of Service",
    categoryPath: "/terms",
    targetCategory: "STATIC",
    leadText: "Official terms and conditions governing purchases and usage on the DATAGHANAnow online platform.",
    overviewHeading: "Agreement Between Customer and DATAGHANAnow",
    overviewParagraphs: [
      "By placing an order on DATAGHANAnow, customers agree to comply with our purchasing policies, phone number accuracy requirements, and network operating terms.",
      "Customers must ensure recipient numbers are typed correctly prior to authorizing Mobile Money checkout."
    ],
    featuresHeading: "Terms Summary",
    features: [
      { title: "Recipient Accuracy", desc: "Customers bear responsibility for providing correct 10-digit Ghana mobile numbers." },
      { title: "Delivery Timelines", desc: "Digital top-ups process rapidly but are subject to temporary telecom network delays." }
    ],
    howItWorksHeading: "Customer Responsibilities",
    howItWorksSteps: [
      { step: 1, title: "Verify Order", desc: "Confirm data volume and mobile number before submitting." }
    ],
    guidelinesHeading: "Legal Compliance",
    guidelines: [
      "All services operate under Ghanaian commerce laws and telecommunications regulations."
    ],
    faqs: [
      { question: "What happens if I enter the wrong phone number?", answer: "Data credited to an incorrect phone number cannot be recalled by telecom providers." }
    ],
    relatedLinks: [
      { label: "Refund Policy", href: "/refund-policy", description: "Read our refund guidelines." },
      { label: "Home Storefront", href: "/", description: "Return to store." }
    ]
  },

  // ==========================================
  // 20. REFUND POLICY (STATIC)
  // ==========================================
  "refund-policy": {
    slug: "refund-policy",
    path: "/refund-policy",
    metaTitle: "Refund & Order Cancellation Policy | DATAGHANAnow",
    metaDescription: "Understand the DATAGHANAnow refund, order verification, and failed top-up credit resolution policies for mobile data purchases in Ghana.",
    canonicalUrl: "https://kingjdeals.site/refund-policy",
    h1: "DATAGHANAnow Refund & Cancellation Policy",
    badge: "REFUND & CREDIT POLICY",
    category: "Refund Policy",
    categoryPath: "/refund-policy",
    targetCategory: "STATIC",
    leadText: "Transparent policies regarding failed transactions, order verification, and refund resolutions on DATAGHANAnow.",
    overviewHeading: "Clear & Fair Resolution for Every Transaction",
    overviewParagraphs: [
      "At DATAGHANAnow, we strive for 100% order satisfaction. If a transaction fails or a top-up cannot be fulfilled due to a network error, our system ensures your funds are protected.",
      "Read below for details on how failed payments and order cancellations are handled."
    ],
    featuresHeading: "Refund Policy Highlights",
    features: [
      { title: "Failed Top-Up Resolution", desc: "If payment is deducted but data cannot be delivered due to network outage, customer care will re-attempt or issue a credit." },
      { title: "Non-Refundable Delivered Orders", desc: "Orders successfully dispatched to a valid recipient number provided by the customer cannot be refunded once credited by the operator." }
    ],
    howItWorksHeading: "How to Request Refund Assistance",
    howItWorksSteps: [
      { step: 1, title: "Provide Reference", desc: "Contact WhatsApp support with your transaction reference number and proof of MoMo debit." }
    ],
    guidelinesHeading: "Resolution Timelines",
    guidelines: [
      "Unfulfilled order inquiries are investigated within 24 hours of report."
    ],
    faqs: [
      { question: "What happens if Mobile Money was debited but my order shows pending?", answer: "Contact support with your transaction reference. Verified failed orders are immediately re-processed or credited." }
    ],
    relatedLinks: [
      { label: "Contact Support", href: "/contact", description: "Reach customer support." },
      { label: "Home Storefront", href: "/", description: "Return to home page." }
    ]
  }
};

export function getSeoPageData(pathOrSlug: string): SeoPageData | null {
  const clean = pathOrSlug.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!clean || clean === 'index' || clean === 'index.html') {
    return SEO_PAGES['home'];
  }
  return SEO_PAGES[clean] || null;
}
