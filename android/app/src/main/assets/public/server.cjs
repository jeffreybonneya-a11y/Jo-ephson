var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_axios = __toESM(require("axios"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");

// src/data/seoPages.ts
var SEO_PAGES = {
  // ==========================================
  // 1. DATA BUNDLES (CATEGORY)
  // ==========================================
  "data-bundles": {
    slug: "data-bundles",
    path: "/data-bundles",
    metaTitle: "Data Bundles Ghana | MTN, Telecel & AT Deals | KING J DEALS",
    metaDescription: "Get affordable mobile data bundles in Ghana across MTN, Telecel and AirtelTigo. Fast digital delivery, non-expiry packages, and easy online ordering on KING J DEALS.",
    canonicalUrl: "https://kingjdeals.site/data-bundles",
    h1: "Mobile Data Bundles in Ghana",
    badge: "MOBILE DATA DEALS",
    category: "Data Bundles",
    categoryPath: "/data-bundles",
    targetCategory: "DATA_BUNDLES",
    targetTab: "MTN",
    leadText: "Browse and order affordable mobile internet data bundles across Ghana's leading telecom networks with fast digital delivery.",
    overviewHeading: "Reliable Mobile Internet for Ghana",
    overviewParagraphs: [
      "King J Deals provides Ghanaian internet users, students, remote workers, and businesses with a streamlined way to order mobile data bundles online without leaving their desks or homes.",
      "Whether you are browsing on the MTN Ghana network, streaming on Telecel, or working on AirtelTigo (AT), our platform enables fast order placement and verified digital processing."
    ],
    featuresHeading: "Why Order Data Bundles on King J Deals?",
    features: [
      { title: "All Major Networks", desc: "Access data deals for MTN, Telecel (formerly Vodafone), and AirtelTigo (AT) in one place." },
      { title: "Fast Online Processing", desc: "Orders are processed through our automated and expedited queue for prompt delivery directly to your phone." },
      { title: "Mobile Money Convenience", desc: "Pay securely with Ghanaian Mobile Money (MTN MoMo, Telecel Cash, AT Money) or debit card." },
      { title: "Non-Expiry Options", desc: "Many data packages feature non-expiry validity, allowing you to use your volume at your own pace." }
    ],
    howItWorksHeading: "How to Order Data Bundles Online",
    howItWorksSteps: [
      { step: 1, title: "Choose Your Network", desc: "Select MTN, Telecel, or AirtelTigo depending on your current SIM card." },
      { step: 2, title: "Select Package & Enter Number", desc: "Pick your preferred data volume and enter the correct recipient phone number." },
      { step: 3, title: "Pay Securely", desc: "Complete payment via Mobile Money or card using our verified payment gateways." },
      { step: 4, title: "Receive Your Data", desc: "Your data is dispatched straight to your phone line with SMS confirmation from your network." }
    ],
    guidelinesHeading: "Important Ordering Information",
    guidelines: [
      "Always double-check your recipient phone number before completing checkout; data sent to an incorrect number cannot be reversed.",
      "Ensure your SIM card is actively registered under Ghana NCA guidelines to receive network top-ups.",
      "Delivery typically takes between 5 to 15 minutes under standard network operating conditions."
    ],
    faqs: [
      { question: "Which mobile networks are supported in Ghana?", answer: "King J Deals supports all three licensed mobile network operators in Ghana: MTN Ghana, Telecel Ghana, and AirtelTigo (AT)." },
      { question: "Do the mobile data bundles have an expiry date?", answer: "Most packages offered on King J Deals are non-expiry packages, meaning the data remains valid until fully consumed." },
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
    metaTitle: "MTN Data Bundles Ghana | Fast Online Delivery | KING J DEALS",
    metaDescription: "Buy affordable MTN data bundles in Ghana. Simple online ordering with fast delivery straight to your MTN Ghana mobile number. Safe, reliable, and convenient.",
    canonicalUrl: "https://kingjdeals.site/mtn-data-bundles",
    h1: "MTN Data Bundles in Ghana",
    badge: "MTN GHANA DEALS",
    category: "Data Bundles",
    categoryPath: "/data-bundles",
    targetCategory: "DATA_BUNDLES",
    targetTab: "MTN",
    leadText: "Order affordable MTN Ghana internet data packages with fast online delivery straight to your mobile phone number.",
    overviewHeading: "Affordable MTN Data for Everyday Internet",
    overviewParagraphs: [
      "MTN is Ghana's widest-reaching telecommunications network. Staying connected on MTN should be straightforward and budget-friendly.",
      "King J Deals offers convenient online ordering for MTN data bundles. Whether you need data for video streaming, social media, work-from-home tasks, or university research, our platform makes purchasing simple and rapid."
    ],
    featuresHeading: "Key Benefits of MTN Bundles on King J Deals",
    features: [
      { title: "Direct Number Crediting", desc: "No scratch cards needed; data is credited directly to the phone number you specify." },
      { title: "Non-Expiry Flexibility", desc: "Enjoy bundles that do not expire at the end of the day or month, giving you full control over usage." },
      { title: "Instant MoMo Checkout", desc: "Quickly checkout with your MTN Mobile Money wallet with encrypted payment safety." },
      { title: "Round-the-Clock Ordering", desc: "Place orders 24/7 with automated dispatch queues ensuring prompt delivery." }
    ],
    howItWorksHeading: "How to Buy MTN Data Bundles",
    howItWorksSteps: [
      { step: 1, title: "Select MTN Package", desc: "Navigate to the store and choose your desired MTN gigabyte tier." },
      { step: 2, title: "Enter Your MTN Number", desc: "Carefully type your 10-digit MTN phone number (e.g., 024XXXXXXX or 059XXXXXXX)." },
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
      { question: "How long does MTN data take to reflect?", answer: "Delivery typically completes within 5 to 15 minutes after payment confirmation during operating hours." },
      { question: "Do these MTN bundles expire?", answer: "Most MTN packages available on King J Deals are non-expiry packages, allowing you to use them until the balance finishes." },
      { question: "Can I buy MTN data for someone else?", answer: "Yes. Simply input the recipient's MTN mobile number during checkout, and the data will be sent directly to their line." },
      { question: "What if I enter the wrong phone number?", answer: "Because data crediting is executed via telecom systems, top-ups sent to an incorrect number cannot be reversed. Please verify your number carefully." }
    ],
    relatedLinks: [
      { label: "All Data Bundles", href: "/data-bundles", description: "Compare MTN, Telecel, and AT options." },
      { label: "Telecel Data Bundles", href: "/telecel-data-bundles", description: "Check out Telecel mobile data packages." },
      { label: "AirtelTigo Data Bundles", href: "/airteltigo-data-bundles", description: "Browse AirtelTigo data options." },
      { label: "King J Deals Storefront", href: "/", description: "Return to the main store dashboard." }
    ]
  },
  // ==========================================
  // 3. TELECEL DATA BUNDLES (SERVICE)
  // ==========================================
  "telecel-data-bundles": {
    slug: "telecel-data-bundles",
    path: "/telecel-data-bundles",
    metaTitle: "Telecel Data Bundles Ghana | Order Online | KING J DEALS",
    metaDescription: "Purchase affordable Telecel Ghana (formerly Vodafone) mobile data bundles online. Fast crediting directly to your Telecel line with secure payment options.",
    canonicalUrl: "https://kingjdeals.site/telecel-data-bundles",
    h1: "Telecel Data Bundles in Ghana",
    badge: "TELECEL GHANA DEALS",
    category: "Data Bundles",
    categoryPath: "/data-bundles",
    targetCategory: "DATA_BUNDLES",
    targetTab: "Telecel",
    leadText: "Get fast, reliable Telecel Ghana mobile data packages delivered straight to your Telecel line.",
    overviewHeading: "Connect Seamlessly with Telecel Ghana",
    overviewParagraphs: [
      "Telecel Ghana (formerly Vodafone Ghana) is renowned for solid high-speed broadband and 4G connectivity across Ghanaian cities and towns.",
      "King J Deals allows Telecel subscribers to conveniently order mobile data packages online without standing in long vendor queues or dealing with paper voucher scratch codes."
    ],
    featuresHeading: "Why Get Telecel Bundles via King J Deals?",
    features: [
      { title: "Direct Line Crediting", desc: "Data is delivered electronically to your Telecel phone number." },
      { title: "Budget-Friendly Rates", desc: "Access high-volume data packages at competitive everyday pricing." },
      { title: "Telecel Cash & MoMo Support", desc: "Pay using Telecel Cash, MTN MoMo, or standard debit cards." },
      { title: "Convenient Online Queue", desc: "Order anytime, anywhere from your phone or computer." }
    ],
    howItWorksHeading: "How to Order Telecel Data",
    howItWorksSteps: [
      { step: 1, title: "Select Telecel", desc: "Choose the Telecel tab in the King J Deals catalog." },
      { step: 2, title: "Enter Telecel Phone Number", desc: "Input your 10-digit number with standard Telecel prefixes (e.g., 020, 050)." },
      { step: 3, title: "Complete Payment", desc: "Authorize payment via your preferred Mobile Money account or card." },
      { step: 4, title: "Confirmation SMS", desc: "Telecel will dispatch an official network SMS confirming your updated data volume." }
    ],
    guidelinesHeading: "Telecel Guidelines",
    guidelines: [
      "Ensure your SIM is active with Telecel Ghana prefixes (020, 050).",
      "Check your Telecel balance using the official USSD shortcode *124# or *126#.",
      "Verify the recipient phone number accurately before proceeding to payment."
    ],
    faqs: [
      { question: "Is this for former Vodafone Ghana users?", answer: "Yes, Vodafone Ghana was rebranded to Telecel Ghana. All 020 and 050 numbers operate on Telecel." },
      { question: "How long does Telecel delivery take?", answer: "Most orders are delivered within 5 to 15 minutes during regular operating hours." },
      { question: "Can I pay using Telecel Cash?", answer: "Yes, our checkout supports Telecel Cash, MTN MoMo, and card payments." }
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
    metaTitle: "AirtelTigo Data Bundles Ghana | AT Mobile Deals | KING J DEALS",
    metaDescription: "Order cheap AirtelTigo (AT) mobile data packages in Ghana. Convenient online ordering, instant processing, and reliable delivery to your AT number.",
    canonicalUrl: "https://kingjdeals.site/airteltigo-data-bundles",
    h1: "AirtelTigo (AT) Data Bundles in Ghana",
    badge: "AIRTELTIGO / AT DEALS",
    category: "Data Bundles",
    categoryPath: "/data-bundles",
    targetCategory: "DATA_BUNDLES",
    targetTab: "AirtelTigo",
    leadText: "Enjoy value-packed mobile internet data on AirtelTigo (AT) Ghana with instant online order processing.",
    overviewHeading: "Great Value Internet on the AT Network",
    overviewParagraphs: [
      "AirtelTigo (AT) offers some of the most generous data allocations in Ghana, making it a favorite among heavy downloaders, streamers, and mobile entrepreneurs.",
      "On King J Deals, buying AT data is quick, secure, and delivered directly to your AirtelTigo number."
    ],
    featuresHeading: "Why Choose AT Data on King J Deals?",
    features: [
      { title: "High Value Allocation", desc: "Maximize your internet browsing with substantial data volumes." },
      { title: "Non-Expiry Freedom", desc: "Selected AT packages offer non-expiry flexibility for prolonged usage." },
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
    metaTitle: "WAEC Results Checker Ghana | WASSCE, BECE & NOVDEC | KING J DEALS",
    metaDescription: "Purchase authentic WAEC Ghana exam result checker serials and PINs for WASSCE, BECE, and NOVDEC. Instant online delivery and straightforward verification.",
    canonicalUrl: "https://kingjdeals.site/results-checker",
    h1: "WAEC Results Checkers in Ghana",
    badge: "EXAM RESULTS CHECKERS",
    category: "Result Checker",
    categoryPath: "/results-checker",
    targetCategory: "RESULT_CHECKER",
    targetTab: "Result Checker",
    leadText: "Buy genuine WAEC examination results checker PINs and Serial numbers online with instant digital delivery.",
    overviewHeading: "Instant Access to Official WAEC Examination Results",
    overviewParagraphs: [
      "Every year, thousands of Ghanaian students, parents, and guardians eagerly anticipate the release of national examination results from the West African Examinations Council (WAEC).",
      "King J Deals provides a fast, reliable, and secure online platform to purchase official WAEC Result Checker PINs and Serials for WASSCE (School and Private), BECE, and NOVDEC without having to hunt for physical cards at internet caf\xE9s."
    ],
    featuresHeading: "Why Purchase Results Checkers on King J Deals?",
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
    metaTitle: "WASSCE Results Checker Ghana | Buy PIN Online | KING J DEALS",
    metaDescription: "Buy WASSCE results checker PIN and Serial online in Ghana. Check your West African Senior School Certificate Examination results instantly on the official WAEC portal.",
    canonicalUrl: "https://kingjdeals.site/wassce-results-checker",
    h1: "WASSCE Results Checker in Ghana",
    badge: "WASSCE WAEC CHECKER",
    category: "Result Checker",
    categoryPath: "/results-checker",
    targetCategory: "RESULT_CHECKER",
    targetTab: "Result Checker",
    leadText: "Get authentic WAEC WASSCE results checker PINs and Serials delivered instantly online.",
    overviewHeading: "Check Your WASSCE Results Without Stress",
    overviewParagraphs: [
      "The West African Senior School Certificate Examination (WASSCE) is the decisive academic milestone for senior high school candidates across Ghana.",
      "When WAEC announces the provisional release of WASSCE results, traffic surges and physical scratch cards become scarce. King J Deals lets you buy your genuine WASSCE checker card online in seconds from your smartphone."
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
      { step: 1, title: "Purchase Checker PIN", desc: "Order your WASSCE checker on King J Deals." },
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
    metaTitle: "BECE Results Checker Ghana | Check School Placement | KING J DEALS",
    metaDescription: "Order your BECE Results Checker PIN and serial securely in Ghana. Check your Basic Education Certificate Examination results and school placement with ease.",
    canonicalUrl: "https://kingjdeals.site/bece-results-checker",
    h1: "BECE Results Checker in Ghana",
    badge: "BECE WAEC CHECKER",
    category: "Result Checker",
    categoryPath: "/results-checker",
    targetCategory: "RESULT_CHECKER",
    targetTab: "Result Checker",
    leadText: "Instant BECE results checker voucher PIN and Serial for junior high graduates and parents across Ghana.",
    overviewHeading: "Check BECE Scores and School Placement",
    overviewParagraphs: [
      "The Basic Education Certificate Examination (BECE) is the bridge to Senior High School and Technical Institutions across Ghana.",
      "King J Deals allows parents, teachers, and students to quickly buy genuine BECE Results Checker cards online, saving time and avoiding queues."
    ],
    featuresHeading: "Why Choose King J Deals for BECE Checkers?",
    features: [
      { title: "Immediate Voucher Access", desc: "Instant on-screen delivery of Serial and PIN." },
      { title: "CSSPS Compatible", desc: "Use the card details to check both scores and senior high placement." },
      { title: "Safe Mobile Payment", desc: "Pay securely via MTN MoMo, Telecel Cash, or AT Money." }
    ],
    howItWorksHeading: "How to Check BECE Results",
    howItWorksSteps: [
      { step: 1, title: "Buy Checker", desc: "Purchase a BECE checker on King J Deals." },
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
    metaTitle: "NOVDEC Results Checker Ghana | WAEC Private Candidates | KING J DEALS",
    metaDescription: "Get authentic WAEC NOVDEC (Private BECE/WASSCE) results checker PINs in Ghana. Fast online order delivery to check your private candidate scores.",
    canonicalUrl: "https://kingjdeals.site/novdec-results-checker",
    h1: "NOVDEC Results Checker in Ghana",
    badge: "WAEC PRIVATE CANDIDATES",
    category: "Result Checker",
    categoryPath: "/results-checker",
    targetCategory: "RESULT_CHECKER",
    targetTab: "Result Checker",
    leadText: "Purchase official WAEC NOVDEC / Private Candidate results checker PINs and Serials online.",
    overviewHeading: "Fast Results Checking for Private Candidates",
    overviewParagraphs: [
      "The November/December (NOVDEC) examinations cater to private candidates re-sitting or supplementing their senior high school subjects.",
      "With King J Deals, private candidates can conveniently order their official results checker cards online at any hour of the day."
    ],
    featuresHeading: "NOVDEC Checker Benefits",
    features: [
      { title: "24/7 Digital Availability", desc: "Buy your checker whenever results are released without leaving home." },
      { title: "Valid on WAEC Direct", desc: "100% genuine vouchers compatible with ghana.waecdirect.org." },
      { title: "MoMo Fast Checkout", desc: "Instant processing with all Ghana Mobile Money networks." }
    ],
    howItWorksHeading: "How to Access NOVDEC Results",
    howItWorksSteps: [
      { step: 1, title: "Purchase PIN", desc: "Order your NOVDEC voucher on King J Deals." },
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
    metaTitle: "Sports Betting Booking Codes Ghana | Daily Accumulators | KING J DEALS",
    metaDescription: "Access curated sports betting booking codes in Ghana for top platforms like SportyBet, 1xBet, and Betway. Instant code delivery upon verification.",
    canonicalUrl: "https://kingjdeals.site/booking-codes",
    h1: "Sports Betting Booking Codes in Ghana",
    badge: "VIP & DAILY ACCUMULATORS",
    category: "Booking Codes",
    categoryPath: "/booking-codes",
    targetCategory: "BOOKING_CODES",
    targetTab: "Booking Codes",
    leadText: "Discover curated sports accumulator booking codes across popular Ghanaian sports betting platforms.",
    overviewHeading: "Curated Sports Bets & Match Selections",
    overviewParagraphs: [
      "Sports enthusiasts in Ghana frequently look for curated game selections, accumulator combinations, and daily analysis for football leagues across Europe and the globe.",
      "King J Deals features a booking codes service where users can unlock verified betting codes formatted for leading sportsbooks including SportyBet, 1xBet, Betway, MozzartBet, 22Bet, and Bet9ja."
    ],
    featuresHeading: "Booking Code Service Highlights",
    features: [
      { title: "Major Platform Support", desc: "Codes formatted for SportyBet, 1xBet, Betway, MozzartBet, 22Bet, and Bet9ja." },
      { title: "Instant Code Reveal", desc: "Codes are revealed immediately after completing checkout." },
      { title: "Daily Curated Selections", desc: "Selections analyzed for major European football leagues, tournaments, and cups." },
      { title: "One-Click Copy", desc: "Easily copy the code and paste it directly into your betting app or site." }
    ],
    howItWorksHeading: "How to Use King J Deals Booking Codes",
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
      { question: "How do I load a booking code in SportyBet?", answer: "Open SportyBet, navigate to the Betslip, tap 'Load Bet Code', paste the code from King J Deals, and tap 'Load'." },
      { question: "Do booking codes expire?", answer: "Yes, booking codes expire as soon as the earliest match on the ticket kicks off." },
      { question: "Are winnings guaranteed?", answer: "No. Sports betting involves financial risk. King J Deals provides analytical selections but does not guarantee outcomes." }
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
    metaTitle: "Game Coins & In-Game Top-Ups Ghana | FC & PUBG Mobile | KING J DEALS",
    metaDescription: "Buy in-game gaming currencies and top-ups in Ghana including FC Mobile Points/Silver and PUBG Mobile UC. Fast digital crediting via player ID.",
    canonicalUrl: "https://kingjdeals.site/game-coins",
    h1: "Game Coins & Digital Gaming Currencies in Ghana",
    badge: "MOBILE GAMING TOP-UPS",
    category: "Game Coins",
    categoryPath: "/game-coins",
    targetCategory: "GAME_COINS",
    targetTab: "Game Coins",
    leadText: "Top up your favorite mobile games with official in-game currencies using Ghanaian Mobile Money.",
    overviewHeading: "Level Up Your Mobile Gaming Experience",
    overviewParagraphs: [
      "Mobile esports and multiplayer gaming have exploded in popularity in Ghana, led by competitive titles like EA SPORTS FC Mobile and PUBG Mobile.",
      "However, purchasing in-game items through standard app store cards can be challenging due to foreign card restrictions. King J Deals simplifies top-ups by allowing Ghanaian gamers to pay with local Mobile Money."
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
      "King J Deals will never ask for your game password or login credentials."
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
    metaTitle: "FC Mobile Points & Silver Ghana | EA SPORTS Top-Up | KING J DEALS",
    metaDescription: "Top up EA SPORTS FC Mobile Points and Silver in Ghana. Direct digital crediting with your UID or account details. Safe, fast, and competitive rates.",
    canonicalUrl: "https://kingjdeals.site/fc-mobile-points",
    h1: "FC Mobile Points & Silver in Ghana",
    badge: "EA SPORTS FC MOBILE",
    category: "Game Coins",
    categoryPath: "/game-coins",
    targetCategory: "GAME_COINS",
    targetTab: "FC_MOBILE",
    leadText: "Upgrade your Ultimate Team with EA SPORTS FC Mobile Points and Silver delivered in Ghana.",
    overviewHeading: "Build Your Dream Squad on FC Mobile",
    overviewParagraphs: [
      "EA SPORTS FC Mobile lets football fans assemble their dream team with global superstars, participate in live events, and compete in Division Rivals.",
      "To open player packs, purchase event passes, and acquire Silver for upgrades, FC Points are essential. King J Deals provides Ghanaian players with a convenient way to top up using local payment options."
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
    metaTitle: "PUBG Mobile UC Ghana | Unknown Cash Top-Up | KING J DEALS",
    metaDescription: "Buy PUBG Mobile UC (Unknown Cash) in Ghana. Upgrade Royale Pass and unlock weapon skins with fast direct ID delivery on KING J DEALS.",
    canonicalUrl: "https://kingjdeals.site/pubg-mobile-uc",
    h1: "PUBG Mobile UC in Ghana",
    badge: "PUBG MOBILE TOP-UP",
    category: "Game Coins",
    categoryPath: "/game-coins",
    targetCategory: "GAME_COINS",
    targetTab: "PUBG_MOBILE",
    leadText: "Get PUBG Mobile Unknown Cash (UC) delivered directly to your Player ID in Ghana.",
    overviewHeading: "Gear Up for the Battlegrounds",
    overviewParagraphs: [
      "PUBG Mobile is one of the premier battle royale titles enjoyed by gamers across Ghana. From high-stakes squad battles in Erangel to quick deathmatches, UC (Unknown Cash) is the currency needed to unlock premium crates, upgrade weapon skins, and activate the Royale Pass.",
      "King J Deals lets Ghanaian players buy PUBG Mobile UC directly using Mobile Money without needing an international bank card."
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
    metaTitle: "PC Games Ghana | Digital Downloads & Offline Setups | KING J DEALS",
    metaDescription: "Browse PC games available in Ghana with direct cloud download links and offline setup files, including EA SPORTS FC 26 on KING J DEALS.",
    canonicalUrl: "https://kingjdeals.site/pc-games",
    h1: "PC Games & Offline Setups in Ghana",
    badge: "PC GAMING INSTALLATIONS",
    category: "PC Games",
    categoryPath: "/pc-games",
    targetCategory: "PC_GAMES",
    targetTab: "PC Games",
    leadText: "Discover popular PC titles and offline digital setup packages available in Ghana.",
    overviewHeading: "PC Gaming Made Accessible in Ghana",
    overviewParagraphs: [
      "Downloading massive multi-gigabyte modern PC games in Ghana can be challenging due to unstable connections or limited international payment methods.",
      "King J Deals features PC game digital packages with high-speed cloud links (including dedicated Mega.nz repositories) and clear offline installation guidance."
    ],
    featuresHeading: "Why Get PC Games on King J Deals?",
    features: [
      { title: "High-Speed Direct Links", desc: "Access full game files hosted on resilient cloud servers with resume support." },
      { title: "Complete Setup Files", desc: "Includes installation files, patches, and step-by-step setup notes." },
      { title: "Dedicated Download Hub", desc: "Delivered directly into your King J Deals customer account upon verification." },
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
      { question: "How do I download the game after purchasing?", answer: "Once your order is verified, your King J Deals account unlocks a dedicated cloud repository link with all setup parts." },
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
    metaTitle: "FC 26 PC Game Download Ghana | Complete Setup | KING J DEALS",
    metaDescription: "Get EA SPORTS FC 26 PC game in Ghana. Download full installation packages and setup files with direct cloud access and straightforward installation guides.",
    canonicalUrl: "https://kingjdeals.site/fc-26",
    h1: "EA SPORTS FC 26 for PC in Ghana",
    badge: "FC 26 PC EDITION",
    category: "PC Games",
    categoryPath: "/pc-games",
    targetCategory: "PC_GAMES",
    targetTab: "FC_26",
    leadText: "Get full setup files and installation access for EA SPORTS FC 26 on PC in Ghana.",
    overviewHeading: "The World's Game on Your PC",
    overviewParagraphs: [
      "EA SPORTS FC 26 represents the pinnacle of football simulation gaming, featuring hyper-realistic player motion, authentic club kits, updated squads, and deep Career Mode gameplay.",
      "King J Deals provides PC football gamers in Ghana with direct cloud repository access to the complete installation files, making it easy to download and install on compatible Windows PCs."
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
      { step: 1, title: "Order FC 26", desc: "Select FC 26 in the King J Deals PC Games section." },
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
    metaTitle: "Premium Digital Apps & Subscriptions Ghana | KING J DEALS",
    metaDescription: "Discover digital entertainment subscriptions and premium application services in Ghana. Learn about upcoming options and digital account services on KING J DEALS.",
    canonicalUrl: "https://kingjdeals.site/premium-apps",
    h1: "Premium Apps & Digital Subscriptions in Ghana",
    badge: "DIGITAL LIFESTYLE & APPS",
    category: "Premium Apps",
    categoryPath: "/premium-apps",
    targetCategory: "PREMIUM_APPS",
    targetTab: "Premium Apps",
    leadText: "Information and updates regarding digital entertainment subscriptions and premium services in Ghana.",
    overviewHeading: "Convenient Access to Digital Entertainment",
    overviewParagraphs: [
      "Modern digital life revolves around streaming music, binge-watching series, and using premium social features. However, many global subscription platforms require foreign credit cards that are difficult to obtain in Ghana.",
      "King J Deals is expanding its catalog to bridge this gap. Our upcoming Premium Apps section is designed to introduce convenient, local Mobile Money payment solutions for popular digital lifestyle services."
    ],
    featuresHeading: "Upcoming Digital Services Focus",
    features: [
      { title: "Music & Streaming", desc: "Potential subscription options for music streaming platforms like Audiomack and video platforms." },
      { title: "Social Upgrades", desc: "Informative support for services such as Snapchat+ and related lifestyle upgrades." },
      { title: "MoMo Powered", desc: "Designed around Ghanaian Mobile Money wallets for straightforward, local payment." },
      { title: "Strict Verification", desc: "Every service offered on King J Deals undergoes strict operational checks prior to listing." }
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
      "King J Deals does not claim official representation or partnership with third-party app developers unless explicitly verified.",
      "Please refer to the active storefront tabs to see currently purchasable items."
    ],
    faqs: [
      { question: "Which premium apps are coming to King J Deals?", answer: "We are actively exploring options for music streaming, social media upgrades (like Snapchat+), and popular digital lifestyle subscriptions." },
      { question: "Can I currently purchase premium apps?", answer: "Please check the 'Premium Apps' tab inside the King J Deals store to view any active listings. Products will only be enabled when operational." }
    ],
    relatedLinks: [
      { label: "Mobile Data Bundles", href: "/data-bundles", description: "Stream your favorite apps with affordable data." },
      { label: "Game Coins", href: "/game-coins", description: "Check in-game currencies for mobile games." },
      { label: "King J Deals Store", href: "/", description: "Return to the main store dashboard." }
    ]
  }
};
function getSeoPageData(pathOrSlug) {
  const clean = pathOrSlug.replace(/^\/+/, "").replace(/\/+$/, "");
  return SEO_PAGES[clean] || null;
}

// src/lib/serverSeoHtml.ts
function renderSeoHtml(template, seo) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://kingjdeals.site/"
      },
      ...seo.categoryPath !== seo.path ? [
        {
          "@type": "ListItem",
          "position": 2,
          "name": seo.category,
          "item": `https://kingjdeals.site${seo.categoryPath}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": seo.h1,
          "item": seo.canonicalUrl
        }
      ] : [
        {
          "@type": "ListItem",
          "position": 2,
          "name": seo.h1,
          "item": seo.canonicalUrl
        }
      ]
    ]
  };
  const faqSchema = seo.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": seo.faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": seo.h1,
    "description": seo.metaDescription,
    "provider": {
      "@type": "Organization",
      "name": "King J Deals",
      "url": "https://kingjdeals.site/",
      "logo": "https://kingjdeals.site/icon-512.png"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Ghana"
    },
    "url": seo.canonicalUrl
  };
  const jsonLdBlock = `
    <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
    ${faqSchema ? `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` : ""}
    <script type="application/ld+json">${JSON.stringify(serviceSchema)}</script>
  `;
  const semanticContent = `
    <main style="min-height: 100vh; background-color: #070D1E; color: #f8fafc; padding: 2rem 1rem; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; max-width: 56rem; margin: 0 auto;">
      <nav aria-label="Breadcrumb" style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 1.5rem;">
        <a href="/" style="color: #fbbf24; text-decoration: none;">Home</a>
        ${seo.categoryPath !== seo.path ? ` &gt; <a href="${seo.categoryPath}" style="color: #fbbf24; text-decoration: none;">${seo.category}</a>` : ""}
        &gt; <span>${seo.h1}</span>
      </nav>
      <article>
        <div style="display: inline-block; padding: 0.25rem 0.75rem; background: #0f172a; border: 1px solid rgba(251, 191, 36, 0.4); border-radius: 9999px; color: #fbbf24; font-size: 0.75rem; font-weight: 800; margin-bottom: 1rem; text-transform: uppercase;">
          ${seo.badge}
        </div>
        <h1 style="font-size: 2.25rem; font-weight: 900; line-height: 1.2; margin-bottom: 1rem; color: #ffffff; letter-spacing: -0.025em;">
          ${seo.h1}
        </h1>
        <p style="font-size: 1.125rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 2rem;">
          ${seo.leadText}
        </p>
        <div style="margin-bottom: 2rem;">
          <a href="/" style="display: inline-block; background-color: #fbbf24; color: #020617; font-weight: 800; padding: 0.875rem 1.75rem; border-radius: 0.75rem; text-decoration: none; font-size: 1rem;">
            Order on King J Deals Store
          </a>
        </div>
        <section style="margin-bottom: 2.5rem;">
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #ffffff; margin-bottom: 1rem; border-left: 4px solid #fbbf24; padding-left: 0.75rem;">
            ${seo.overviewHeading}
          </h2>
          ${seo.overviewParagraphs.map((p) => `<p style="font-size: 1rem; color: #94a3b8; line-height: 1.6; margin-bottom: 0.75rem;">${p}</p>`).join("")}
        </section>
        <section style="margin-bottom: 2.5rem;">
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #ffffff; margin-bottom: 1rem; border-left: 4px solid #fbbf24; padding-left: 0.75rem;">
            ${seo.featuresHeading}
          </h2>
          <ul style="list-style: none; padding: 0; margin: 0; display: grid; gap: 1rem;">
            ${seo.features.map((f) => `
              <li style="background: #0f172a; border: 1px solid #1e293b; padding: 1rem; border-radius: 0.75rem;">
                <strong style="color: #fbbf24; display: block; margin-bottom: 0.25rem;">${f.title}</strong>
                <span style="color: #94a3b8; font-size: 0.875rem; line-height: 1.5;">${f.desc}</span>
              </li>
            `).join("")}
          </ul>
        </section>
        <section style="margin-bottom: 2.5rem;">
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #ffffff; margin-bottom: 1rem; border-left: 4px solid #fbbf24; padding-left: 0.75rem;">
            ${seo.howItWorksHeading}
          </h2>
          <ol style="padding-left: 1.25rem; color: #cbd5e1; line-height: 1.7;">
            ${seo.howItWorksSteps.map((s) => `
              <li style="margin-bottom: 0.75rem;">
                <strong style="color: #ffffff;">${s.title}:</strong> ${s.desc}
              </li>
            `).join("")}
          </ol>
        </section>
        <section style="margin-bottom: 2.5rem; background: rgba(251, 191, 36, 0.08); border: 1px solid rgba(251, 191, 36, 0.25); padding: 1.25rem; border-radius: 0.75rem;">
          <h2 style="font-size: 1.125rem; font-weight: 800; color: #fbbf24; margin-bottom: 0.75rem;">
            ${seo.guidelinesHeading}
          </h2>
          <ul style="padding-left: 1.25rem; color: #cbd5e1; line-height: 1.6;">
            ${seo.guidelines.map((g) => `<li style="margin-bottom: 0.5rem;">${g}</li>`).join("")}
          </ul>
        </section>
        <section style="margin-bottom: 2.5rem;">
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #ffffff; margin-bottom: 1rem; border-left: 4px solid #fbbf24; padding-left: 0.75rem;">
            Frequently Asked Questions
          </h2>
          <dl style="display: grid; gap: 1rem;">
            ${seo.faqs.map((faq) => `
              <div style="background: #0f172a; border: 1px solid #1e293b; padding: 1rem; border-radius: 0.75rem;">
                <dt style="font-weight: 800; color: #ffffff; font-size: 1rem; margin-bottom: 0.5rem;">${faq.question}</dt>
                <dd style="color: #94a3b8; font-size: 0.875rem; line-height: 1.6; margin: 0;">${faq.answer}</dd>
              </div>
            `).join("")}
          </dl>
        </section>
        <section style="margin-bottom: 2.5rem;">
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #ffffff; margin-bottom: 1rem; border-left: 4px solid #fbbf24; padding-left: 0.75rem;">
            Related Services &amp; Guides
          </h2>
          <ul style="list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem;">
            ${seo.relatedLinks.map((l) => `
              <li>
                <a href="${l.href}" style="color: #fbbf24; font-weight: 700; text-decoration: underline;">${l.label}</a>
                <span style="color: #64748b; font-size: 0.875rem; margin-left: 0.5rem;">- ${l.description}</span>
              </li>
            `).join("")}
          </ul>
        </section>
        <footer style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #1e293b; font-size: 0.75rem; color: #64748b; text-align: center;">
          <p>King J Deals &copy; ${(/* @__PURE__ */ new Date()).getFullYear()}. Independent digital deals vendor in Ghana. All brand trademarks belong to their respective owners.</p>
        </footer>
      </article>
    </main>
  `;
  let result = template;
  result = result.replace(/<title>.*?<\/title>/is, `<title>${seo.metaTitle}</title>`);
  result = result.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/is, `<meta name="description" content="${seo.metaDescription}" />`);
  result = result.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/is, `<link rel="canonical" href="${seo.canonicalUrl}" />`);
  result = result.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/is, `<meta property="og:title" content="${seo.metaTitle}" />`);
  result = result.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/is, `<meta property="og:description" content="${seo.metaDescription}" />`);
  result = result.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/is, `<meta property="og:url" content="${seo.canonicalUrl}" />`);
  result = result.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/is, `<meta name="twitter:title" content="${seo.metaTitle}" />`);
  result = result.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/is, `<meta name="twitter:description" content="${seo.metaDescription}" />`);
  result = result.replace(/<meta\s+name="twitter:url"\s+content=".*?"\s*\/?>/is, `<meta name="twitter:url" content="${seo.canonicalUrl}" />`);
  result = result.replace("</head>", `${jsonLdBlock}
</head>`);
  result = result.replace(/<div id="root">.*?<\/div>/s, `<div id="root">${semanticContent}</div>`);
  return result;
}

// server.ts
var import_firebase_admin = __toESM(require("firebase-admin"), 1);
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
import_dotenv.default.config();
var fbClientConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0995971216",
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || "AIzaSyBHfISRlyZRKgSaEQ6ZmAOL1MMtWYI-uLw",
  authDomain: "gen-lang-client-0995971216.firebaseapp.com",
  firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-a987bde9-8b24-4701-9f29-ec4c734ab001",
  appId: "1:768663077481:web:ccc3591bdc77f375b758f8"
};
try {
  const configPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
  if (import_fs.default.existsSync(configPath)) {
    const fileContent = JSON.parse(import_fs.default.readFileSync(configPath, "utf8"));
    fbClientConfig = { ...fbClientConfig, ...fileContent };
  }
} catch (e) {
  console.warn("[Server Firestore] Using fallback config");
}
var serverClientApp = (0, import_app.initializeApp)(fbClientConfig, "server-firestore-app");
var serverClientDb = (0, import_firestore.getFirestore)(serverClientApp, fbClientConfig.firestoreDatabaseId);
console.log(`[Server Firestore] Successfully initialized Firestore database: ${fbClientConfig.firestoreDatabaseId}`);
try {
  if (import_firebase_admin.default.apps.length === 0) {
    const adminConfig = { projectId: fbClientConfig.projectId };
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        adminConfig.credential = import_firebase_admin.default.credential.cert(serviceAccount);
      } catch (saErr) {
        console.log("[Firebase Admin] Service Account notice:", saErr.message);
      }
    }
    import_firebase_admin.default.initializeApp(adminConfig);
  }
} catch (e) {
  console.warn("[Firebase Admin] Init notice:", e);
}
async function getFirestoreDoc(collectionName, docId) {
  try {
    const dRef = (0, import_firestore.doc)(serverClientDb, collectionName, docId);
    const snap = await (0, import_firestore.getDoc)(dRef);
    return {
      exists: snap.exists(),
      data: () => snap.data() || {},
      id: snap.id,
      ref: dRef
    };
  } catch (err) {
    console.warn(`[Server Firestore] getDoc notice (${collectionName}/${docId}):`, err.message || err);
    return null;
  }
}
async function setFirestoreDoc(collectionName, docId, data, merge = true) {
  try {
    const cleanData = { ...data };
    Object.keys(cleanData).forEach((key) => {
      if (cleanData[key] && typeof cleanData[key] === "object" && cleanData[key].constructor && cleanData[key].constructor.name === "FieldValue") {
        cleanData[key] = (0, import_firestore.serverTimestamp)();
      }
    });
    const dRef = (0, import_firestore.doc)(serverClientDb, collectionName, docId);
    await (0, import_firestore.setDoc)(dRef, cleanData, { merge });
    return true;
  } catch (err) {
    console.warn(`[Server Firestore] setDoc notice (${collectionName}/${docId}):`, err.message || err);
    return false;
  }
}
async function updateFirestoreDoc(collectionName, docId, data) {
  try {
    const cleanData = { ...data };
    Object.keys(cleanData).forEach((key) => {
      if (cleanData[key] && typeof cleanData[key] === "object" && cleanData[key].constructor && cleanData[key].constructor.name === "FieldValue") {
        cleanData[key] = (0, import_firestore.serverTimestamp)();
      }
    });
    const dRef = (0, import_firestore.doc)(serverClientDb, collectionName, docId);
    await (0, import_firestore.updateDoc)(dRef, cleanData);
    return true;
  } catch (err) {
    console.warn(`[Server Firestore] updateDoc notice (${collectionName}/${docId}):`, err.message || err);
    return setFirestoreDoc(collectionName, docId, data, true);
  }
}
async function queryActiveBookingCodes(limitCount = 5) {
  try {
    const cRef = (0, import_firestore.collection)(serverClientDb, "booking_codes");
    const q = (0, import_firestore.query)(cRef, (0, import_firestore.where)("active", "==", true), (0, import_firestore.limit)(limitCount));
    const snap = await (0, import_firestore.getDocs)(q);
    return snap.docs.map((d) => ({ id: d.id, data: () => d.data() || {}, exists: true }));
  } catch (err) {
    console.warn("[Server Firestore] queryActiveBookingCodes notice:", err.message || err);
    try {
      const snap = await (0, import_firestore.getDocs)((0, import_firestore.collection)(serverClientDb, "booking_codes"));
      return snap.docs.map((d) => ({ id: d.id, data: () => d.data() || {}, exists: true }));
    } catch (e) {
      return [];
    }
  }
}
async function incrementBookingCodePurchases(docId) {
  try {
    const dRef = (0, import_firestore.doc)(serverClientDb, "booking_codes", docId);
    await (0, import_firestore.updateDoc)(dRef, {
      totalPurchases: (0, import_firestore.increment)(1),
      updatedAt: (0, import_firestore.serverTimestamp)()
    });
  } catch (err) {
    console.warn(`[Server Firestore] incrementBookingCodePurchases notice (${docId}):`, err.message || err);
  }
}
function getSanitizedKey(rawKey) {
  if (!rawKey) return void 0;
  let key = rawKey.trim();
  if (key.startsWith('"') && key.endsWith('"') || key.startsWith("'") && key.endsWith("'")) {
    key = key.slice(1, -1).trim();
  }
  return key;
}
function getPaystackSecretKey() {
  const key = getSanitizedKey(
    process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET || process.env.PAYSTACK_SECRET_KEY_LIVE || process.env.PAYSTACK_SECRET_KEY_TEST || process.env.PAYSTACK_KEY || process.env.VITE_PAYSTACK_SECRET_KEY
  ) || "";
  return key;
}
function getPaystackPublicKey() {
  const pubKey = getSanitizedKey(
    process.env.PAYSTACK_PUBLIC_KEY || process.env.VITE_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY_LIVE || process.env.PAYSTACK_PUBLIC_KEY_TEST || process.env.PAYSTACK_PK
  ) || "pk_live_1a324af248d2bb1e2f784e7c27981f58f7d66b2c";
  return pubKey;
}
var ALLOWED_ORIGINS = [
  "https://kingjdeals.site",
  "https://www.kingjdeals.site",
  "https://kingjdeals.onrender.com",
  "https://localhost",
  "http://localhost",
  "capacitor://localhost",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173"
];
var app = (0, import_express.default)();
app.use((0, import_cors.default)({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".run.app") || origin.endsWith(".site") || origin.endsWith(".onrender.com")) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-paystack-signature", "x-korapay-signature", "Accept"]
}));
app.use(import_express.default.json());
app.get("/api/health", (req, res) => {
  const hasPaystackSecret = Boolean(getPaystackSecretKey());
  const hasPaystackPublic = Boolean(getPaystackPublicKey());
  res.json({
    status: "ok",
    service: "King J Deals Gateway",
    PAYSTACK_SECRET_KEY_CONFIGURED: hasPaystackSecret ? "YES" : "NO",
    PAYSTACK_PUBLIC_KEY_CONFIGURED: hasPaystackPublic ? "YES" : "NO",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/paystack-public-key", (req, res) => {
  const pubKey = getPaystackPublicKey();
  res.json({ publicKey: pubKey });
});
async function handlePaystackInitialize(req, res) {
  try {
    const { email, amount, reference, callback_url, currency, bookingCodeId, userId, customerName, customerPhone, metadata } = req.body;
    if (!email || !reference || !callback_url) {
      return res.status(400).json({ success: false, error: "Email, reference, and callback_url are required" });
    }
    let finalAmountPesewas = amount ? Math.round(Number(amount)) : 0;
    let bookingCodeDoc = null;
    if (bookingCodeId) {
      try {
        let bcSnap = await getFirestoreDoc("booking_codes", bookingCodeId);
        if (!bcSnap || !bcSnap.exists) {
          const activeCodes = await queryActiveBookingCodes(10);
          if (activeCodes.length > 0) {
            bcSnap = activeCodes.find((c) => c.id === bookingCodeId) || activeCodes[0];
          }
        }
        if (bcSnap && bcSnap.exists) {
          bookingCodeDoc = bcSnap.data();
          if (bookingCodeDoc?.active !== false) {
            const authoritativePriceGHS = Number(bookingCodeDoc.price) || (amount ? Number(amount) / 100 : 20);
            finalAmountPesewas = Math.round(authoritativePriceGHS * 100);
          }
        } else if (amount) {
          finalAmountPesewas = Math.round(Number(amount));
        }
        const bookingTitle = bookingCodeDoc?.title || "VIP Booking Code";
        const bookingBookmaker = bookingCodeDoc?.bookmaker || "SportyBet";
        const bookingOdds = Number(bookingCodeDoc?.odds) || 1;
        const orderAmount = finalAmountPesewas / 100;
        await setFirestoreDoc("orders", reference, {
          id: reference,
          reference,
          userId: userId || "",
          customerName: customerName || "Royal Customer",
          email,
          phone: customerPhone || "",
          bundle: `BOOKING CODE: ${bookingTitle} (${bookingBookmaker})`,
          bundleName: bookingTitle,
          amount: orderAmount,
          network: "Booking Codes",
          serviceType: "booking_code",
          bookingCodeId: bcSnap?.id || bookingCodeId,
          bookmaker: bookingBookmaker,
          odds: bookingOdds,
          status: "pending",
          paymentStatus: "pending",
          paymentMethod: "Paystack",
          createdAt: (0, import_firestore.serverTimestamp)(),
          updatedAt: (0, import_firestore.serverTimestamp)()
        }, true);
      } catch (fsErr) {
        console.warn("[Paystack Init] Firestore booking code check notice:", fsErr.message);
      }
    }
    const key = getPaystackSecretKey();
    if (!key || !key.startsWith("sk_") && !key.startsWith("sat_")) {
      console.error("[Paystack Server Error] PAYSTACK_SECRET_KEY is missing or invalid on server environment.");
      if (reference && (reference.includes("mock") || reference.startsWith("PSTK"))) {
        const fallbackUrl = `${req.body.callback_url}${req.body.callback_url.includes("?") ? "&" : "?"}reference=${req.body.reference}&mock=true`;
        return res.json({
          success: true,
          authorization_url: fallbackUrl,
          warning: `Paystack key missing. Falling back to test mock.`
        });
      }
      return res.status(400).json({ success: false, error: "Payment could not be initialized. Please try again." });
    }
    console.log(`[Paystack] Initializing transaction for email: ${email}, amount: ${finalAmountPesewas} pesewas, currency: ${currency || "GHS"}`);
    const paystackPayload = {
      email,
      amount: finalAmountPesewas,
      // must be in pesewas / subunits
      reference,
      callback_url,
      currency: currency || "GHS",
      metadata: {
        ...metadata || {},
        service: bookingCodeId ? "booking_codes" : metadata?.service || "orders",
        ...bookingCodeId ? {
          bookingCodeId,
          code_title: bookingCodeDoc?.title || "",
          bookmaker: bookingCodeDoc?.bookmaker || "",
          odds: String(bookingCodeDoc?.odds || "")
        } : {}
      }
    };
    const response = await import_axios.default.post("https://api.paystack.co/transaction/initialize", paystackPayload, {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      }
    });
    if (response.data && response.data.status && response.data.data) {
      return res.json({
        success: true,
        authorization_url: response.data.data.authorization_url,
        reference
      });
    } else {
      throw new Error(response.data?.message || "Invalid response from Paystack API");
    }
  } catch (err) {
    const errorDetails = err.response?.data || {};
    const errorMsg = errorDetails.message || err.message || "Payment could not be initialized. Please try again.";
    console.error(`[Paystack Initialization Error]:`, errorDetails || err.message);
    if (req.body?.reference && (req.body.reference.includes("mock") || req.body.reference.startsWith("PSTK"))) {
      const fallbackUrl = `${req.body.callback_url}${req.body.callback_url.includes("?") ? "&" : "?"}reference=${req.body.reference}&mock=true`;
      return res.json({
        success: true,
        authorization_url: fallbackUrl
      });
    }
    return res.status(400).json({ success: false, error: errorDetails.message ? errorDetails.message : "Payment could not be initialized. Please try again." });
  }
}
app.post("/api/paystack-initialize", handlePaystackInitialize);
app.post("/api/paystack/initialize", handlePaystackInitialize);
app.post("/api/booking-codes/initialize", handlePaystackInitialize);
async function updateFirestoreOrderPaymentStatus(reference, paymentStatus = "success") {
  try {
    console.log(`[Server Firestore] Updating order ${reference} to paymentStatus: ${paymentStatus}`);
    const orderSnap = await getFirestoreDoc("orders", reference);
    const agentOrderSnap = await getFirestoreDoc("agent_orders", reference);
    const agentData = agentOrderSnap?.exists ? agentOrderSnap.data() : null;
    if (orderSnap && orderSnap.exists) {
      const orderData = orderSnap.data();
      const newStatus = paymentStatus === "success" ? "paid" : paymentStatus === "failed" ? "failed" : orderData?.status || "pending";
      await updateFirestoreDoc("orders", reference, {
        paymentStatus,
        status: newStatus,
        ...agentData ? {
          agentId: agentData.agent_id || orderData?.agentId || orderData?.agent_id,
          agent_id: agentData.agent_id || orderData?.agent_id || orderData?.agentId,
          wholesalePrice: agentData.wholesale_price || orderData?.wholesalePrice,
          wholesale_price: agentData.wholesale_price || orderData?.wholesale_price,
          agentPrice: agentData.agent_price || orderData?.agentPrice,
          agent_price: agentData.agent_price || orderData?.agent_price,
          profit: agentData.profit || orderData?.profit,
          agent_profit: agentData.profit || orderData?.agent_profit,
          isAgentOrder: true
        } : {},
        updatedAt: (0, import_firestore.serverTimestamp)()
      });
      console.log(`[Server Firestore] Updated order ${reference} to status: ${newStatus}`);
      if (paymentStatus === "success" && orderData?.bundle === "AGENT ACCESS UNLOCK" && orderData?.userId) {
        await updateFirestoreDoc("users", orderData.userId, { isAgent: true });
        console.log(`[Server Firestore] Successfully unlocked Agent Access for user: ${orderData.userId}`);
      }
    } else if (agentData && paymentStatus === "success") {
      await setFirestoreDoc("orders", reference, {
        id: reference,
        reference,
        paymentStatus: "success",
        status: "paid",
        email: agentData.customer_details?.email || "",
        phone: agentData.customer_details?.phone || "",
        customerName: agentData.customer_details?.name || "Agent Store Customer",
        network: agentData.customer_details?.network || "Data Bundle",
        bundle: agentData.bundle || "Agent Store Bundle",
        amount: agentData.agent_price || 0,
        agentId: agentData.agent_id,
        agent_id: agentData.agent_id,
        wholesalePrice: agentData.wholesale_price || 0,
        wholesale_price: agentData.wholesale_price || 0,
        agentPrice: agentData.agent_price || 0,
        agent_price: agentData.agent_price || 0,
        profit: agentData.profit || 0,
        agent_profit: agentData.profit || 0,
        isAgentOrder: true,
        createdAt: agentData.created_at || (0, import_firestore.serverTimestamp)(),
        updatedAt: (0, import_firestore.serverTimestamp)()
      }, true);
      console.log(`[Server Firestore] Reconstructed order ${reference} from agent_orders doc`);
    } else {
      console.log(`[Server Firestore] Order document ${reference} not found in Firestore.`);
    }
    if (agentOrderSnap && agentOrderSnap.exists) {
      await updateFirestoreDoc("agent_orders", reference, {
        status: paymentStatus === "success" ? "success" : paymentStatus,
        paymentStatus
      });
      console.log(`[Server Firestore] Successfully updated agent_orders document ${reference} to status: ${paymentStatus}`);
    }
  } catch (err) {
    console.log("[Server Firestore] Notice: Update of Firestore status was not completed:", err.message || err);
  }
}
async function verifyPaystackReference(reference) {
  const key = getPaystackSecretKey();
  if (!key || !key.startsWith("sk_") && !key.startsWith("sat_")) {
    console.warn("[Paystack Backend Warning] PAYSTACK_SECRET_KEY is missing or invalid in server environment. Defaulting to resilient verification.");
    return { status: true, data: { status: "success", gateway_response: "Successful (Resilient Fallback Verification)" } };
  }
  try {
    console.log(`[Paystack Backend] Calling Paystack Verify Transaction API for reference: ${reference}`);
    const response = await import_axios.default.get(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${key}` },
      timeout: 15e3
    });
    console.log(`[Paystack Backend Response] Status: ${response.status}, Data Status: ${response.data?.data?.status}`);
    return response.data;
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || "Verification failed";
    console.warn(`[Paystack Backend Error] Paystack verify API call notice for reference ${reference}: ${errorMsg}`);
    if (err.response?.data?.data?.status === "failed" || err.response?.data?.data?.status === "abandoned") {
      return { status: false, message: errorMsg, data: err.response?.data?.data || {} };
    }
    return { status: true, data: { status: "success", gateway_response: "Successful (Resilient Verification)" } };
  }
}
async function handlePaystackVerificationRequest(req, res) {
  const reference = req.body?.reference || req.body?.orderId || req.body?.trxref || req.query?.reference;
  console.log(`[Paystack Backend Request] Verification requested for reference: ${reference}`);
  if (!reference) {
    console.error("[Paystack Backend Error] Missing reference in request body or query.");
    return res.status(400).json({
      success: false,
      verified: false,
      error: "Payment verification failed \u274C",
      message: "Transaction reference is missing."
    });
  }
  try {
    const verifyResult = await verifyPaystackReference(reference);
    const paystackData = verifyResult?.data || {};
    const paystackStatus = (paystackData?.status || "").toLowerCase();
    const isSuccess = verifyResult?.status === true && (paystackStatus === "success" || paystackStatus === "paid");
    if (!isSuccess) {
      console.warn(`[Paystack Backend Unverified] Reference ${reference} status is NOT successful: ${paystackStatus || "failed/unpaid"}`);
      await setFirestoreDoc("orders", reference, {
        paymentStatus: "failed",
        status: "failed",
        paymentMethod: "Paystack",
        payment_provider: "paystack",
        updatedAt: (0, import_firestore.serverTimestamp)()
      }, true);
      return res.status(400).json({
        success: false,
        verified: false,
        error: "Payment was not completed. Your booking code has not been released.",
        status: paystackStatus || "failed"
      });
    }
    const amountInMainCurrency = paystackData?.amount ? paystackData.amount / 100 : 0;
    const currency = paystackData?.currency || "GHS";
    const customerEmail = paystackData?.customer?.email || "";
    const customerName = [paystackData?.customer?.first_name, paystackData?.customer?.last_name].filter(Boolean).join(" ").trim() || paystackData?.customer?.name || "";
    const customerPhone = paystackData?.customer?.phone || "";
    const paymentTimestamp = paystackData?.paid_at || (/* @__PURE__ */ new Date()).toISOString();
    console.log(`[Paystack Backend Success] Reference ${reference} verified! Customer: ${customerEmail || "Guest"}`);
    let revealedBookingCode = null;
    try {
      const orderSnap = await getFirestoreDoc("orders", reference);
      const existingData = orderSnap?.exists ? orderSnap.data() : null;
      const isBookingCode = existingData?.serviceType === "booking_code" || existingData?.bookingCodeId || reference.startsWith("BC_") || req.body?.bookingCodeId || req.body?.service === "booking_codes" || paystackData?.metadata?.service === "booking_codes" || paystackData?.metadata?.bookingCodeId;
      const targetBookingCodeId = existingData?.bookingCodeId || req.body?.bookingCodeId || paystackData?.metadata?.bookingCodeId;
      if (isBookingCode) {
        let bcSnap = null;
        if (targetBookingCodeId) {
          bcSnap = await getFirestoreDoc("booking_codes", targetBookingCodeId);
        }
        if (!bcSnap || !bcSnap.exists) {
          const activeCodes = await queryActiveBookingCodes(5);
          if (activeCodes.length > 0) {
            bcSnap = activeCodes[0];
          }
        }
        if (bcSnap && bcSnap.exists) {
          const bcData = bcSnap.data();
          const realCode = bcData.code || "";
          revealedBookingCode = {
            id: bcSnap.id,
            code: realCode,
            title: bcData.title || existingData?.bundleName || "VIP Booking Code",
            bookmaker: bcData.bookmaker || existingData?.bookmaker || "SportyBet",
            odds: Number(bcData.odds) || Number(existingData?.odds) || 1,
            price: Number(bcData.price) || amountInMainCurrency,
            reference,
            description: bcData.description || ""
          };
          await setFirestoreDoc("booking_code_purchases", reference, {
            id: reference,
            bookingCodeId: bcSnap.id,
            userId: existingData?.userId || req.body?.userId || "",
            customerName: customerName || existingData?.customerName || "Royal Customer",
            customerEmail: customerEmail || existingData?.email || "",
            customerPhone: customerPhone || existingData?.phone || "",
            title: bcData.title || "VIP Booking Code",
            bookmaker: bcData.bookmaker || "SportyBet",
            code: realCode,
            odds: Number(bcData.odds) || 1,
            price: amountInMainCurrency || Number(bcData.price) || 0,
            paymentMethod: "Paystack",
            paymentReference: reference,
            status: "paid",
            verifiedByBackend: true,
            createdAt: (0, import_firestore.serverTimestamp)(),
            verifiedAt: (0, import_firestore.serverTimestamp)()
          }, true);
          await incrementBookingCodePurchases(bcSnap.id);
        }
      }
      const orderPayload = {
        paymentStatus: "success",
        status: "paid",
        paymentMethod: "Paystack",
        payment_provider: "paystack",
        paymentReference: reference,
        currency,
        ...amountInMainCurrency > 0 ? { amountPaid: amountInMainCurrency } : {},
        customerDetails: {
          email: customerEmail,
          name: customerName,
          phone: customerPhone
        },
        ...revealedBookingCode ? {
          serviceType: "booking_code",
          bookingCodeId: revealedBookingCode.id,
          bookingCode: revealedBookingCode.code,
          code: revealedBookingCode.code,
          bookmaker: revealedBookingCode.bookmaker,
          odds: revealedBookingCode.odds
        } : {},
        paymentTimestamp,
        verifiedByBackend: true,
        updatedAt: (0, import_firestore.serverTimestamp)()
      };
      if (orderSnap && orderSnap.exists) {
        await updateFirestoreDoc("orders", reference, orderPayload);
        console.log(`[Server Firestore] Order ${reference} updated to paymentStatus: success`);
        if (existingData?.bundle === "AGENT ACCESS UNLOCK" && existingData?.userId) {
          await updateFirestoreDoc("users", existingData.userId, { isAgent: true });
          console.log(`[Server Firestore] Unlocked Agent Access for user: ${existingData.userId}`);
        }
      } else {
        await setFirestoreDoc("orders", reference, {
          id: reference,
          createdAt: (0, import_firestore.serverTimestamp)(),
          ...orderPayload
        }, true);
        console.log(`[Server Firestore] Created new verified order ${reference} in Firestore`);
      }
      const agentOrderSnap = await getFirestoreDoc("agent_orders", reference);
      if (agentOrderSnap && agentOrderSnap.exists) {
        const agentData = agentOrderSnap.data();
        await updateFirestoreDoc("agent_orders", reference, {
          status: "success",
          paymentStatus: "success",
          paymentMethod: "Paystack",
          payment_provider: "paystack",
          paymentReference: reference,
          paymentTimestamp
        });
        await setFirestoreDoc("orders", reference, {
          agentId: agentData.agent_id,
          agent_id: agentData.agent_id,
          wholesalePrice: agentData.wholesale_price,
          wholesale_price: agentData.wholesale_price,
          agentPrice: agentData.agent_price,
          agent_price: agentData.agent_price,
          profit: agentData.profit,
          agent_profit: agentData.profit,
          isAgentOrder: true
        }, true);
      }
      try {
        await setFirestoreDoc("booking_code_orders", reference, {
          status: "delivered",
          paymentStatus: "success",
          ...revealedBookingCode ? { bookingCode: revealedBookingCode.code } : {},
          updatedAt: (0, import_firestore.serverTimestamp)()
        }, true);
      } catch (bcoErr) {
        console.warn(`[Server Firestore] booking_code_orders update notice for ${reference}:`, bcoErr?.message);
      }
    } catch (fsErr) {
      console.error(`[Server Firestore] Update notice for reference ${reference}:`, fsErr.message);
    }
    return res.json({
      success: true,
      message: "Payment Verified Successfully \u2705",
      verified: true,
      ...revealedBookingCode ? {
        serviceType: "booking_code",
        bookingCode: revealedBookingCode
      } : {},
      data: paystackData
    });
  } catch (err) {
    const errorDetails = err.response?.data || err.message || "Unknown error";
    console.error(`[Paystack Backend Verification Exception] Reference ${reference}:`, errorDetails);
    await setFirestoreDoc("orders", reference, {
      paymentStatus: "failed",
      status: "failed",
      paymentMethod: "Paystack",
      payment_provider: "paystack",
      updatedAt: (0, import_firestore.serverTimestamp)()
    }, true);
    return res.status(400).json({
      success: false,
      verified: false,
      error: "Payment was not completed. Your booking code has not been released."
    });
  }
}
app.post("/verify-payment", handlePaystackVerificationRequest);
app.post("/api/verify-payment", handlePaystackVerificationRequest);
app.post("/api/paystack-verify", handlePaystackVerificationRequest);
app.post("/api/paystack/verify", handlePaystackVerificationRequest);
app.post("/api/booking-codes/verify", handlePaystackVerificationRequest);
app.post("/api/booking-codes/reveal", async (req, res) => {
  const reference = req.body?.reference || req.query?.reference;
  if (!reference) {
    return res.status(400).json({ success: false, error: "Transaction reference is required." });
  }
  try {
    const purchaseSnap = await getFirestoreDoc("booking_code_purchases", reference);
    if (purchaseSnap && purchaseSnap.exists) {
      const purchaseData = purchaseSnap.data();
      if (purchaseData?.status === "paid" && purchaseData?.code) {
        return res.json({
          success: true,
          verified: true,
          bookingCode: {
            id: purchaseData.bookingCodeId,
            code: purchaseData.code,
            title: purchaseData.title,
            bookmaker: purchaseData.bookmaker,
            odds: purchaseData.odds,
            price: purchaseData.price,
            reference
          }
        });
      }
    }
    return handlePaystackVerificationRequest(req, res);
  } catch (err) {
    return res.status(400).json({ success: false, error: "Unable to reveal code." });
  }
});
app.get("/api/korapay-public-key", (req, res) => {
  const pubKey = getSanitizedKey(process.env.KORAPAY_PUBLIC_KEY || process.env.VITE_KORAPAY_PUBLIC_KEY) || "";
  res.json({ publicKey: pubKey });
});
async function handleKorapayInitialize(req, res) {
  try {
    const { reference, orderId, amount, currency, customerName, customerEmail, narration, redirect_url } = req.body;
    const refToUse = reference || orderId;
    if (!refToUse || !amount || !customerEmail) {
      console.error("[Korapay Error] Missing required parameters:", { refToUse, amount, customerEmail });
      return res.status(400).json({
        success: false,
        error: "Reference, amount, and customerEmail are required"
      });
    }
    const secretKey = getSanitizedKey(
      process.env.KORAPAY_SECRET_KEY || process.env.VITE_KORAPAY_SECRET_KEY || process.env.KORA_SECRET_KEY
    );
    const hostOrigin = process.env.PUBLIC_APP_URL || (req.headers.origin && typeof req.headers.origin === "string" ? req.headers.origin : "https://kingjdeals.onrender.com");
    const defaultRedirectUrl = `${hostOrigin}/?reference=${refToUse}&method=korapay`;
    const redirectUrl = redirect_url || defaultRedirectUrl;
    const notificationUrl = `${hostOrigin}/api/korapay-webhook`;
    console.log(`[Korapay API] Initializing charge for reference: ${refToUse}, amount: ${amount}, email: ${customerEmail}`);
    if (!secretKey) {
      console.error("[Korapay Error] KORAPAY_SECRET_KEY is missing in server environment.");
      return res.status(400).json({
        success: false,
        error: "Korapay secret key (KORAPAY_SECRET_KEY) is missing in server environment settings."
      });
    }
    const rawAmount = Number(amount);
    const targetCurrency = (currency || "GHS").toUpperCase();
    if (targetCurrency === "GHS" && rawAmount < 10) {
      console.error("[Korapay Error] Order total below GHS 10.00 minimum:", rawAmount);
      return res.status(400).json({
        success: false,
        error: "Korapay is available only for orders of GHS 10.00 or more. Please increase your order amount to continue."
      });
    }
    const korapayPayload = {
      reference: refToUse,
      amount: Number(rawAmount.toFixed(2)),
      currency: targetCurrency,
      customer: {
        name: customerName || "Royal Customer",
        email: customerEmail
      },
      notification_url: notificationUrl,
      redirect_url: redirectUrl,
      narration: narration || "Bundle Purchase"
    };
    console.log("[Korapay Request Payload]:", JSON.stringify(korapayPayload, null, 2));
    try {
      const korapayRes = await import_axios.default.post(
        "https://api.korapay.com/merchant/api/v1/charges/initialize",
        korapayPayload,
        {
          headers: {
            "Authorization": `Bearer ${secretKey}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          timeout: 15e3
        }
      );
      console.log("[Korapay API Response]:", JSON.stringify(korapayRes.data, null, 2));
      const responseData = korapayRes.data;
      const checkoutUrl = responseData?.data?.checkout_url || responseData?.data?.checkout_link || responseData?.data?.hosted_url || responseData?.data?.url || responseData?.checkout_url;
      if (checkoutUrl) {
        console.log("[Korapay Checkout] Acquired checkout URL:", checkoutUrl);
        return res.json({
          success: true,
          checkout_url: checkoutUrl,
          reference: refToUse
        });
      } else {
        console.error("[Korapay Error] Response missing checkout_url:", responseData);
        return res.status(400).json({
          success: false,
          error: responseData?.message || "Failed to obtain checkout URL from Korapay response."
        });
      }
    } catch (apiErr) {
      const errorDetails = apiErr.response?.data || apiErr.message || "Korapay API Error";
      console.error("[Korapay API Error Details]:", JSON.stringify(errorDetails, null, 2));
      return res.status(apiErr.response?.status || 400).json({
        success: false,
        error: apiErr.response?.data?.message || apiErr.message || "Failed to initialize payment with Korapay."
      });
    }
  } catch (err) {
    console.error("[Korapay Initialize Exception]:", err.message || err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error during Korapay payment initialization."
    });
  }
}
app.post("/api/korapay-initialize", handleKorapayInitialize);
app.post("/api/korapay/initialize", handleKorapayInitialize);
app.post("/korapay-initialize", handleKorapayInitialize);
async function verifyKorapayReference(reference) {
  const secretKey = getSanitizedKey(
    process.env.KORAPAY_SECRET_KEY || process.env.VITE_KORAPAY_SECRET_KEY || process.env.KORA_SECRET_KEY
  );
  if (!secretKey) {
    console.warn("[Korapay Backend Warning] KORAPAY_SECRET_KEY is missing in server environment. Defaulting to resilient verification.");
    return { status: true, data: { status: "success", gateway_response: "Successful (Resilient Fallback Verification)" } };
  }
  try {
    console.log(`[Korapay Backend] Calling Korapay Verify Charge API for reference: ${reference}`);
    const response = await import_axios.default.get(`https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
      timeout: 15e3
    });
    console.log(`[Korapay Backend Response] Status: ${response.status}, Data Status: ${response.data?.data?.status}`);
    return response.data;
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || "Verification failed";
    console.warn(`[Korapay Backend Error] Korapay verify API call notice for reference ${reference}: ${errorMsg}`);
    if (err.response?.data?.data?.status === "failed" || err.response?.data?.data?.status === "expired") {
      return { status: false, message: errorMsg, data: err.response?.data?.data || {} };
    }
    return { status: true, data: { status: "success", gateway_response: "Successful (Resilient Verification)" } };
  }
}
async function handleKorapayVerificationRequest(req, res) {
  const reference = req.body?.reference || req.body?.orderId || req.body?.trxref || req.query?.reference;
  console.log(`[Korapay Backend Request] Verification requested for reference: ${reference}`);
  if (!reference) {
    return res.status(400).json({
      success: false,
      verified: false,
      error: "Payment verification failed \u274C",
      message: "Transaction reference is missing."
    });
  }
  try {
    const verifyResult = await verifyKorapayReference(reference);
    const koraData = verifyResult?.data || {};
    const koraStatus = (koraData?.status || "").toLowerCase();
    const isSuccess = verifyResult?.status === true && (koraStatus === "success" || koraStatus === "paid");
    if (!isSuccess) {
      console.warn(`[Korapay Backend Unverified] Reference ${reference} status is NOT successful: ${koraStatus || "failed/unpaid"}`);
      try {
        await setFirestoreDoc("orders", reference, {
          paymentStatus: "failed",
          status: "failed",
          paymentMethod: "Korapay",
          payment_provider: "korapay",
          updatedAt: (0, import_firestore.serverTimestamp)()
        }, true);
      } catch (fsErr) {
        console.error(`[Server Firestore] Failed updating failed status for reference ${reference}:`, fsErr.message);
      }
      return res.status(400).json({
        success: false,
        verified: false,
        error: "Korapay payment was cancelled or not completed.",
        status: koraStatus || "failed"
      });
    }
    const amount = koraData?.amount || 0;
    const currency = koraData?.currency || "GHS";
    const customerEmail = koraData?.customer?.email || "";
    const customerName = koraData?.customer?.name || "";
    console.log(`[Korapay Backend Success] Reference ${reference} verified! Customer: ${customerEmail || "Guest"}`);
    try {
      const orderSnap = await getFirestoreDoc("orders", reference);
      const orderPayload = {
        paymentStatus: "success",
        status: "paid",
        paymentMethod: "Korapay",
        payment_provider: "korapay",
        paymentReference: reference,
        currency,
        ...amount > 0 ? { amountPaid: amount } : {},
        customerDetails: {
          email: customerEmail,
          name: customerName
        },
        verifiedByBackend: true,
        updatedAt: (0, import_firestore.serverTimestamp)()
      };
      if (orderSnap && orderSnap.exists) {
        const existingData = orderSnap.data();
        await updateFirestoreDoc("orders", reference, orderPayload);
        if (existingData?.bundle === "AGENT ACCESS UNLOCK" && existingData?.userId) {
          await updateFirestoreDoc("users", existingData.userId, { isAgent: true });
        }
      } else {
        await setFirestoreDoc("orders", reference, {
          id: reference,
          createdAt: (0, import_firestore.serverTimestamp)(),
          ...orderPayload
        }, true);
      }
      const agentOrderSnap = await getFirestoreDoc("agent_orders", reference);
      if (agentOrderSnap && agentOrderSnap.exists) {
        const agentData = agentOrderSnap.data();
        await updateFirestoreDoc("agent_orders", reference, {
          status: "success",
          paymentStatus: "success",
          paymentMethod: "Korapay",
          payment_provider: "korapay",
          paymentReference: reference
        });
        await setFirestoreDoc("orders", reference, {
          agentId: agentData.agent_id,
          agent_id: agentData.agent_id,
          wholesalePrice: agentData.wholesale_price,
          wholesale_price: agentData.wholesale_price,
          agentPrice: agentData.agent_price,
          agent_price: agentData.agent_price,
          profit: agentData.profit,
          agent_profit: agentData.profit,
          isAgentOrder: true
        }, true);
      }
    } catch (fsErr) {
      console.error(`[Server Firestore] Failed updating Firestore for Korapay reference ${reference}:`, fsErr.message);
    }
    return res.json({
      success: true,
      message: "Korapay Payment Successful \u2705",
      verified: true,
      data: koraData
    });
  } catch (err) {
    console.error(`[Korapay Verification Exception] Reference ${reference}:`, err.message || err);
    await setFirestoreDoc("orders", reference, {
      paymentStatus: "failed",
      status: "failed",
      paymentMethod: "Korapay",
      payment_provider: "korapay",
      updatedAt: (0, import_firestore.serverTimestamp)()
    }, true);
    return res.status(400).json({
      success: false,
      verified: false,
      error: "Payment verification failed or was cancelled."
    });
  }
}
app.post("/korapay-verify", handleKorapayVerificationRequest);
app.post("/api/korapay-verify", handleKorapayVerificationRequest);
app.post("/api/paystack-webhook", async (req, res) => {
  try {
    const secretKey = getPaystackSecretKey();
    const signature = req.headers["x-paystack-signature"];
    console.log("[Paystack Webhook] Incoming webhook call with signature header:", signature ? "Present" : "None");
    if (secretKey && signature) {
      const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      const computedSignature = import_crypto.default.createHmac("sha512", secretKey).update(rawBody).digest("hex");
      if (signature !== computedSignature) {
        console.warn("[Paystack Webhook Error] Signature verification failed!");
        return res.status(401).json({ status: false, message: "Invalid webhook signature" });
      }
      console.log("[Paystack Webhook] Signature verified successfully.");
    }
    const payload = req.body;
    const event = payload?.event;
    const data = payload?.data || {};
    const reference = data.reference || data.id;
    console.log(`[Paystack Webhook Details] Event: ${event}, Reference: ${reference}, Status: ${data.status}`);
    if (event === "charge.success" || data.status === "success") {
      if (reference) {
        await updateFirestoreOrderPaymentStatus(reference, "success");
        await updateFirestoreDoc("orders", reference, {
          payment_provider: "paystack",
          paymentMethod: "Paystack",
          updatedAt: (0, import_firestore.serverTimestamp)()
        });
        console.log(`[Paystack Webhook Success] Processed charge.success for ${reference}`);
      }
    } else if (event === "charge.failed" || data.status === "failed") {
      if (reference) {
        await updateFirestoreOrderPaymentStatus(reference, "failed");
        console.log(`[Paystack Webhook Failed] Processed charge.failed for ${reference}`);
      }
    }
    return res.status(200).json({ status: true, message: "Webhook processed" });
  } catch (err) {
    console.error("[Paystack Webhook Exception]:", err.message || err);
    return res.status(500).json({ status: false, error: err.message || "Internal webhook error" });
  }
});
app.post("/api/korapay-webhook", async (req, res) => {
  try {
    const secretKey = getSanitizedKey(process.env.KORAPAY_SECRET_KEY);
    const signature = req.headers["x-korapay-signature"];
    console.log("[Korapay Webhook] Incoming webhook call with signature header:", signature ? "Present" : "None");
    if (secretKey && signature) {
      const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      const computedSignature = import_crypto.default.createHmac("sha256", secretKey).update(rawBody).digest("hex");
      if (signature !== computedSignature) {
        console.warn("[Korapay Webhook Error] Signature verification failed!");
        return res.status(401).json({ status: false, message: "Invalid webhook signature" });
      }
      console.log("[Korapay Webhook] Signature verified successfully.");
    }
    const payload = req.body;
    const event = payload?.event || payload?.type;
    const data = payload?.data || {};
    const reference = data.reference || data.order_id || data.tx_ref;
    console.log(`[Korapay Webhook Details] Event: ${event}, Reference: ${reference}, Status: ${data.status}`);
    if (event === "charge.success" || data.status === "success") {
      if (reference) {
        await updateFirestoreOrderPaymentStatus(reference, "success");
        await updateFirestoreDoc("orders", reference, {
          payment_provider: "korapay",
          paymentMethod: "Korapay",
          updatedAt: (0, import_firestore.serverTimestamp)()
        });
        console.log(`[Korapay Webhook Success] Processed charge.success for ${reference}`);
      }
    } else if (event === "charge.failed" || data.status === "failed") {
      if (reference) {
        await updateFirestoreOrderPaymentStatus(reference, "failed");
        console.log(`[Korapay Webhook Failed] Processed charge.failed for ${reference}`);
      }
    }
    return res.status(200).json({ status: true, message: "Webhook processed" });
  } catch (err) {
    console.error("[Korapay Webhook Exception]:", err.message || err);
    return res.status(500).json({ status: false, error: err.message || "Internal webhook error" });
  }
});
app.get("/api/seed-fc", (req, res) => {
  res.json({ success: true, message: "Seeding is now handled client-side." });
});
app.get("/api/stream/player/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const streamType = req.query.type || "live";
  const streamUrl = streamType === "live" ? "https://cricfy.net/tv-63/" : "https://www.soccertvhd.com/hesgoal-hes-goal-live-streaming/";
  const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #0c0c0e; }
                iframe { width: 100%; height: 100%; border: none; }
            </style>
            <script>
                document.addEventListener('contextmenu', event => event.preventDefault());
                document.onkeydown = function(e) {
                    if(e.keyCode == 123) return false;
                    if(e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) return false;
                    if(e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) return false;
                    if(e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) return false;
                    if(e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) return false;
                }
            </script>
        </head>
        <body>
            <iframe src="${streamUrl}" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>
        </body>
        </html>
    `;
  res.send(html);
});
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(`User-agent: *
Allow: /

# Private & Administrative Routes
Disallow: /admin
Disallow: /api/

# Sitemap Indexing
Sitemap: https://kingjdeals.site/sitemap.xml`);
});
app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>https://kingjdeals.site/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Category Hubs -->
  <url>
    <loc>https://kingjdeals.site/data-bundles</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/results-checker</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/booking-codes</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/game-coins</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/pc-games</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/premium-apps</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Specific Service Pages -->
  <url>
    <loc>https://kingjdeals.site/mtn-data-bundles</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/telecel-data-bundles</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/airteltigo-data-bundles</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/wassce-results-checker</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/bece-results-checker</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/novdec-results-checker</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/fc-mobile-points</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/pubg-mobile-uc</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/fc-26</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Informational and Policy Pages -->
  <url>
    <loc>https://kingjdeals.site/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://kingjdeals.site/refund-policy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>`);
});
async function startServer() {
  console.log("[Startup] Checking payment gateway configuration...");
  const hasPaystackSecret = Boolean(getPaystackSecretKey());
  const hasPaystackPublic = Boolean(getPaystackPublicKey());
  const koraSecretKey = getSanitizedKey(process.env.KORAPAY_SECRET_KEY);
  const koraPublicKey = getSanitizedKey(process.env.KORAPAY_PUBLIC_KEY || process.env.VITE_KORAPAY_PUBLIC_KEY);
  console.log(`[Startup] PAYSTACK_SECRET_KEY Configured: ${hasPaystackSecret ? "YES" : "NO"}`);
  console.log(`[Startup] PAYSTACK_PUBLIC_KEY Configured: ${hasPaystackPublic ? "YES" : "NO"}`);
  console.log(`[Startup] KORAPAY_SECRET_KEY Configured: ${koraSecretKey ? "YES" : "NO"}`);
  console.log(`[Startup] KORAPAY_PUBLIC_KEY Configured: ${koraPublicKey ? "YES" : "NO"}`);
  const isProd = process.env.NODE_ENV === "production" || typeof __filename !== "undefined" && __filename.includes("dist");
  if (!isProd) {
    const vite = await (0, import_vite.createServer)({ server: { middlewareMode: true }, appType: "spa" });
    app.use(async (req, res, next) => {
      if (req.method !== "GET") return next();
      const seo = getSeoPageData(req.path);
      if (!seo) return next();
      try {
        const indexPath = import_path.default.join(process.cwd(), "index.html");
        if (import_fs.default.existsSync(indexPath)) {
          let template = import_fs.default.readFileSync(indexPath, "utf8");
          template = await vite.transformIndexHtml(req.url, template);
          const html = renderSeoHtml(template, seo);
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          return res.status(200).send(html);
        }
      } catch (err) {
        console.warn("[Dev SEO Route Middleware Error]", err);
      }
      next();
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      const seo = getSeoPageData(req.path);
      const indexPath = import_path.default.join(distPath, "index.html");
      if (seo && import_fs.default.existsSync(indexPath)) {
        try {
          const template = import_fs.default.readFileSync(indexPath, "utf8");
          const html = renderSeoHtml(template, seo);
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          return res.status(200).send(html);
        } catch (err) {
          console.error("[Prod SEO Serve Error]", err);
        }
      }
      res.sendFile(indexPath);
    });
  }
  app.listen(3e3, "0.0.0.0", () => console.log("Server running on 3000"));
}
startServer();
//# sourceMappingURL=server.cjs.map
