export type Language = "en" | "sw";
export type Theme = "light" | "dark";

export interface Translations {
  nav: {
    brandSubtitle: string;
    home: string;
    howItWorks: string;
    checkRecord: string;
    openMenu: string;
    closeMenu: string;
    themeLight: string;
    themeDark: string;
    langEnglish: string;
    langSwahili: string;
  };
  home: {
    heroBadge: string;
    heroTitle: string;
    heroDesc: string;
    heroCtaCheck: string;
    heroCtaHow: string;
    journeyTitle: string;
    journeySubtitle: string;
    journeyDisclaimer: string;
    stepPrefix?: string;
    journeySteps: Array<{
      id: string;
      label: string;
      detail: string;
    }>;
    whyTitle: string;
    whyP1: string;
    whyP2: string;
    howTitle: string;
    howBadge: string;
    howSteps: Array<{
      step: string;
      title: string;
      summary: string;
      detail: string;
    }>;
    readMore: string;
    readLess: string;
    valueTitle: string;
    valueItems: string[];
    trustTitle: string;
    canTellTitle: string;
    canTellDesc: string;
    cannotProveTitle: string;
    cannotProveDesc: string;
    ctaBannerTitle: string;
    ctaBannerDesc: string;
    ctaBannerBtn: string;
  };
  verify: {
    headerTitle: string;
    headerDesc: string;
    openCardTitle: string;
    openCardDesc1: string;
    openCardDesc2: string;
    searchPlaceholder: string;
    btnSearch: string;
    demoExamplesTitle: string;
    advancedJsonTitle: string;
    codeCardTitle: string;
    missingDownstreamNotice: string;
    moreWaysSummary: string;
    pasteLabel: string;
    pastePlaceholder: string;
    pasteHelp: string;
    btnCheck: string;
    btnChooseFile: string;
    demoHeader: string;
    demoWorking: string;
    demoRejected: string;
    demoChanged: string;
    demoCorrected: string;
    demoRepeated: string;
    demoBadge: string;
    demoRecordNotice: string;
    statusCheckingTitle: string;
    statusCheckingDesc: string;
    glanceTitle: string;
    harvestedLabel: string;
    harvestedDesc: string;
    progressLabel: string;
    progressNote: string;
    rejectionTitle: string;
    rejectionHeader: string;
    rejectionRule: string;
    amountsTitle: string;
    amountsHarvested: string;
    amountsAccepted: string;
    amountsProcessed: string;
    amountsEndUse: string;
    amountsDisclaimer: string;
    timelineTitle: string;
    timelineEmpty: string;
    thingsTitle: string;
    creditsTitle: string;
    creditsDesc: string;
    creditsRecordedSuffix: string;
    techTitle: string;
    badgeMatched: string;
    badgeNotMatched: string;
    badgeLookCloser: string;
    copy: string;
    copied: string;
    notAvailable: string;
    certificateCode: string;
    batchId: string;
    contract: string;
    chain: string;
    paymentRef: string;
    qrTitle: string;
    qrDesc: string;
    qrCopyLink: string;
    qrLinkCopied: string;
    qrAlt: string;
    dates: {
      collectedOn: string;
      checkedOn: string;
      acceptedOn: string;
      settledOn: string;
      processedOn: string;
      putToUseOn: string;
    };
  };
  footer: {
    tagline: string;
    disclaimer: string;
    home: string;
    howItWorks: string;
    checkRecord: string;
    copyright: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      brandSubtitle: "Tracking lake cleanup from weeds to useful products",
      home: "Home",
      howItWorks: "How it works",
      checkRecord: "Check a certificate",
      openMenu: "Open navigation menu",
      closeMenu: "Close navigation menu",
      themeLight: "Switch to light mode",
      themeDark: "Switch to dark mode",
      langEnglish: "English",
      langSwahili: "Kiswahili",
    },
    home: {
      heroBadge: "Open tracking for lake cleanup & beneficial products",
      heroTitle: "See how invasive lake weeds turn into useful products.",
      heroDesc:
        "Water hyacinth is a thick weed choking Lake Victoria. Local teams harvest it, inspect it, and turn it into clean cooking fuel, fuel briquettes, woven mats, biochar, or agricultural fertilizer and compost. ZiwaChain records every step on an open, tamper-proof digital ledger so anyone, from climate scientists to curious neighbors, can verify the work is genuine.",
      heroCtaCheck: "Check a certificate",
      heroCtaHow: "How it works",
      journeyTitle: "How a harvest travels from lake to useful products",
      journeySubtitle: "Click any step to see what happens:",
      journeyDisclaimer:
        "This is a quick guide to how the system works. To inspect a real harvest, enter its certificate code below.",
      stepPrefix: "Step",
      journeySteps: [
        {
          id: "harvest",
          label: "Pull weeds from the lake",
          detail:
            "Harvesters pull the thick weed out of Lake Victoria, bring it ashore, and weigh it. They log how many kilograms were collected and the location, keeping harvester names private.",
        },
        {
          id: "verified",
          label: "Check for clean quality",
          detail:
            "An inspector checks the harvest on the beach. It should be clean plant matter, not weighed down with mud, sand, or plastic. Clean batches are approved; dirty ones are rejected.",
        },
        {
          id: "processed",
          label: "Turn weeds into useful products",
          detail:
            "Local workshops turn the harvested plants into clean cooking gas (biogas), fuel briquettes, woven mats, biochar, or rich organic fertilizer and compost. The system makes sure the output numbers balance with the fresh plants received.",
        },
        {
          id: "available",
          label: "Anyone can verify the story",
          detail:
            "Anyone with a phone can scan the batch's QR code to see this entire story. The record is permanently locked on a public ledger so no one can secretly alter the numbers.",
        },
      ],
      whyTitle: "Why keep an open record?",
      whyP1:
        "Cleaning an entire lake takes teamwork: one group pulls the weeds, another inspects the quality, and local workshops turn them into clean cooking fuel, fuel briquettes, woven mats, or plant fertilizer.",
      whyP2:
        "Without clear records, people might wonder: Did anyone really clean the lake? Did they exaggerate the weight? ZiwaChain gives everyone an unchangeable digital receipt for every single kilogram harvested.",
      howBadge: "How it works",
      howTitle: "Four simple steps from lake to products.",
      howSteps: [
        {
          step: "01",
          title: "Weeds are weighed and logged",
          summary: "Harvesters weigh the fresh plants at the beach and log the kilograms.",
          detail:
            "Harvesters text or submit their harvest weight right from the lakeshore. A permanent digital record is created immediately so the original numbers cannot be quietly edited.",
        },
        {
          step: "02",
          title: "An inspector checks the quality",
          summary: "An independent checker approves clean batches and turns away dirty ones.",
          detail:
            "Inspectors make sure the plants are clean and not weighed down with mud or rocks. Only genuine, clean harvests move forward; contaminated batches are permanently marked as rejected.",
        },
        {
          step: "03",
          title: "Weeds turn into valuable products",
          summary: "Workshops turn the harvest into cooking gas, fuel briquettes, woven mats, or compost.",
          detail:
            "Workshops document the products they make, such as biogas, briquettes, woven mats, biochar, or agricultural fertilizer and compost. The math has to balance: you can't report more finished products than the raw plants you actually took in.",
        },
        {
          step: "04",
          title: "Anyone can check the certificate",
          summary: "Each batch gets a public digital certificate that anyone can open.",
          detail:
            "Every certificate has a unique code and QR link. Anyone with a phone or computer can see the full timeline, dates, and proof without needing special accounts.",
        },
      ],
      readMore: "Learn more",
      readLess: "Show less",
      valueTitle: "One simple record. Zero guesswork.",
      valueItems: [
        "Exactly how much weed was pulled from the lake.",
        "Whether it passed in-person quality inspection.",
        "What useful products were made (such as cooking fuel, mats, briquettes, or fertilizer).",
        "Confirmation that harvesters were paid.",
        "Proof that the record hasn't been altered or faked.",
        "Open, verifiable proof for scientists, supporters, and the public.",
      ],
      trustTitle: "What this record can (and cannot) prove.",
      canTellTitle: "What it proves",
      canTellDesc:
        "It proves that the information on the certificate matches the exact, tamper-proof record locked in when the work was done. No one can secretly change numbers after the fact.",
      cannotProveTitle: "What it cannot prove on its own",
      cannotProveDesc:
        "A computer record shows what trusted people reported and signed, but a computer cannot physically walk to the lake. That is why human inspectors check the physical weeds on the beach.",
      ctaBannerTitle: "Have a collection certificate or code?",
      ctaBannerDesc:
        "Scan its QR code or enter the code to see the harvest weight, inspection results, and production journey.",
      ctaBannerBtn: "Check a certificate",
    },
    verify: {
      headerTitle: "Check a collection certificate",
      headerDesc: "Enter the code on a certificate or open your certificate link to see what happened to a batch of harvested weed.",
      openCardTitle: "Look up a certificate",
      openCardDesc1:
        "Scan the QR code on a certificate or enter its short code below to load its full story.",
      openCardDesc2: "Want to try it out first? Click one of the interactive test examples below.",
      searchPlaceholder: "Enter code (like EHCQJ-3GMNQ) or batch ID…",
      btnSearch: "Look up",
      demoExamplesTitle: "Try these interactive test examples to see how it works:",
      advancedJsonTitle: "For developers: Upload or paste raw certificate data",
      codeCardTitle: "Certificate code & shareable link",
      missingDownstreamNotice: "Later steps (like turning weeds into fuel, fertilizer, or mats) have not been logged yet for this recent batch.",
      moreWaysSummary: "More ways to check a record",
      pasteLabel: "Paste certificate JSON data",
      pastePlaceholder: "Paste certificate details here…",
      pasteHelp: "This option is for developers and local testing.",
      btnCheck: "Check certificate",
      btnChooseFile: "Choose file",
      demoHeader: "Sample test batches",
      demoWorking: "Approved Batch",
      demoRejected: "Rejected Batch (Muddy Weed)",
      demoChanged: "Tampered / Faked Numbers",
      demoCorrected: "Typo Corrected on Record",
      demoRepeated: "Reused Photo Flagged",
      demoBadge: "Demo Record",
      demoRecordNotice: "Interactive test demonstration (Sample data on Base Sepolia)",
      statusCheckingTitle: "Checking this record",
      statusCheckingDesc: "Verifying the certificate and its permanent digital record in your browser…",
      glanceTitle: "Summary of this batch",
      harvestedLabel: "What was collected?",
      harvestedDesc: "The amount of water hyacinth pulled from the lake.",
      progressLabel: "Current stage",
      progressNote: "Shows how far this batch has traveled so far.",
      rejectionTitle: "Why this batch was stopped",
      rejectionHeader: "This harvest did not pass physical quality inspection",
      rejectionRule:
        "Because this batch failed inspection (for example, containing too much mud or foreign debris), it was stopped. It did not earn work credits and was not sent for processing.",
      amountsTitle: "Recorded weights and products",
      amountsHarvested: "Weight collected",
      amountsAccepted: "Weight approved",
      amountsProcessed: "Weight processed",
      amountsEndUse: "Useful products made",
      amountsDisclaimer:
        "These numbers come from reports filed at each step and locked into the digital ledger so they cannot be altered.",
      timelineTitle: "Timeline of what happened",
      timelineEmpty: "No steps have been recorded yet.",
      thingsTitle: "Notes & items flagged for review",
      creditsTitle: "Community work credits",
      creditsDesc:
        "Work credits are digital badges proving authentic environmental work was completed. They are not currency and cannot be spent as money.",
      creditsRecordedSuffix: "credits earned",
      techTitle: "Technical & blockchain details (for experts and auditors)",
      badgeMatched: "verified",
      badgeNotMatched: "does not match",
      badgeLookCloser: "needs review",
      copy: "Copy",
      copied: "Copied!",
      notAvailable: "Not recorded yet",
      certificateCode: "Certificate code",
      batchId: "Batch ID",
      contract: "Smart Contract",
      chain: "Blockchain Network",
      paymentRef: "Payment reference",
      qrTitle: "Scan with your phone to open this certificate",
      qrDesc:
        "Anyone can scan this QR code with a smartphone camera to open and check this certificate independently.",
      qrCopyLink: "Copy certificate link",
      qrLinkCopied: "Link copied!",
      qrAlt: "QR code for this certificate",
      dates: {
        collectedOn: "Collected on",
        checkedOn: "Checked on",
        acceptedOn: "Accepted on",
        settledOn: "Settled on",
        processedOn: "Processed on",
        putToUseOn: "Put to use on",
      },
    },
    footer: {
      tagline:
        "An open public tool to verify Lake Victoria cleanup records and follow harvested weeds from lake to useful products.",
      disclaimer:
        "A verified digital record proves the numbers match what was permanently recorded at each step. Physical inspectors verify the real plants on the beach.",
      home: "Home",
      howItWorks: "How it works",
      checkRecord: "Check a certificate",
      copyright: "© 2026 ZiwaChain",
    },
  },
  sw: {
    nav: {
      brandSubtitle: "Kufuatilia usafi wa ziwa kutoka magugu hadi bidhaa zenye manufaa",
      home: "Nyumbani",
      howItWorks: "Jinsi inavyofanya kazi",
      checkRecord: "Kagua cheti",
      openMenu: "Fungua menyu",
      closeMenu: "Funga menyu",
      themeLight: "Washa hali ya mwangaza",
      themeDark: "Washa hali ya giza",
      langEnglish: "English",
      langSwahili: "Kiswahili",
    },
    home: {
      heroBadge: "Ufuatiliaji wa wazi kwa usafi wa ziwa na bidhaa endelevu",
      heroTitle: "Tazama jinsi magugu ya ziwani yanavyogeuka kuwa bidhaa za thamani.",
      heroDesc:
        "Gugu maji ni mmea unaoziba Ziwa Victoria. Vikundi vya jamii huyavuna, kuyakagua, na kuyachakata kuwa gesi ya kupikia, mikeka, mkaa mbadala (briquettes), mbolea ya kilimo, au mboji. ZiwaChain huweka kumbukumbu ya kila hatua kwenye daftari la wazi lisiloweza kubadilishwa ili kila mtu ajionee kuwa kazi ilifanyika kwa uaminifu.",
      heroCtaCheck: "Kagua cheti",
      heroCtaHow: "Jinsi inavyofanya kazi",
      journeyTitle: "Jinsi mzigo unavyosafiri kutoka ziwani hadi kuwa bidhaa za thamani",
      journeySubtitle: "Bofya hatua yoyote kuona kinachofanyika:",
      journeyDisclaimer:
        "Huu ni mwongozo rahisi wa jinsi mfumo unavyofanya kazi. Kukagua mzigo halisi, weka msimbo wa cheti chake hapa chini.",
      stepPrefix: "Hatua",
      journeySteps: [
        {
          id: "harvest",
          label: "Kuvuna magugu ziwani",
          detail:
            "Wavunaji huondoa magugu hatari ya gugu maji kutoka Ziwa Victoria, kuyaleta ufukweni, na kuyapima. Hurekodi uzito na eneo, huku majina yao yakihifadhiwa kwa faragha.",
        },
        {
          id: "verified",
          label: "Kukagua usafi na ubora",
          detail:
            "Mkaguzi huchunguza mimea ufukweni kuhakikisha ni safi—bila matope mengi, mchanga, au takataka. Mizigo safi inakubaliwa; mizigo michafu inakataliwa.",
        },
        {
          id: "processed",
          label: "Kutengeneza bidhaa zenye manufaa",
          detail:
            "Viwanda vidogo na mafundi wa jamii huchakata magugu kuwa gesi ya kupikia (bayogasi), mkaa mbadala, mikeka iliyofumwa, mbolea ya kilimo, au mboji. Mfumo unahakikisha nambari za bidhaa zinalingana na mimea iliyopokelewa.",
        },
        {
          id: "available",
          label: "Mtu yeyote anaweza kukagua",
          detail:
            "Mtu yeyote aliye na simu anaweza kuchanganua msimbo wa QR wa mzigo huo ili kuona safari hii yote. Rekodi imefungwa kabisa mtandaoni ili mtu yeyote asibadilishe nambari.",
        },
      ],
      whyTitle: "Kwa nini kuweka rekodi ya wazi?",
      whyP1:
        "Kusafisha ziwa zima kunahitaji ushirikiano: kikundi kimoja kinavuna magugu, mwingine anakagua ubora, na mafundi au viwanda wanayageuza kuwa gesi safi, mkaa mbadala, mikeka, au mbolea ya kilimo.",
      whyP2:
        "Bila rekodi zilizo wazi, nambari zinaweza kukadiriwa au kutiwa chumvi. ZiwaChain inampa kila mtu risiti ya kidijitali isiyoweza kubadilishwa kwa kila kilo iliyovunwa.",
      howBadge: "Jinsi inavyofanya kazi",
      howTitle: "Hatua nne rahisi kutoka ziwani hadi bidhaa.",
      howSteps: [
        {
          step: "01",
          title: "Magugu yanapimwa na kurekodiwa",
          summary: "Wavunaji hupima mimea mibichi ufukweni na kurekodi uzito wa kilo.",
          detail:
            "Wavunaji hutuma uzito wa mavuno kupitia simu moja kwa moja kutoka ufukweni. Kumbukumbu ya kudumu ya kidijitali hutengenezwa mara moja ili nambari zisiweze kubadilishwa kisiri.",
        },
        {
          step: "02",
          title: "Mkaguzi anakagua ubora",
          summary: "Mkaguzi huru huidhinisha mizigo safi na kukataa ile michafu.",
          detail:
            "Wakaguzi wanahakikisha mimea ni safi na haijalemewa na matope au mawe. Mizigo safi pekee ndiyo inayosonga mbele; mizigo michafu inakataliwa rasmi.",
        },
        {
          step: "03",
          title: "Magugu yanageuka kuwa bidhaa za thamani",
          summary: "Viwanda na mafundi hubadilisha magugu kuwa gesi ya kupikia, mkaa mbadala, mikeka, au mbolea ya kilimo.",
          detail:
            "Wachakataji hurekodi bidhaa wanazotengeneza—kama bayogasi, mkaa mbadala, mikeka, au mbolea ya kilimo na mboji. Hesabu lazima zilingane: huwezi kuripoti bidhaa nyingi kuliko magugu uliyopokea.",
        },
        {
          step: "04",
          title: "Mtu yeyote anaweza kukagua cheti",
          summary: "Kila mzigo hupata cheti cha wazi cha kidijitali ambacho mtu yeyote anaweza kufungua.",
          detail:
            "Kila cheti kina msimbo maalum na kiungo cha QR. Mtu yeyote mwenye simu au kompyuta anaweza kuona ratiba kamili na tarehe bila kuhitaji akaunti maalum.",
        },
      ],
      readMore: "Soma zaidi",
      readLess: "Funga maelezo",
      valueTitle: "Rekodi moja rahisi. Hakuna kubahatisha.",
      valueItems: [
        "Kiasi kamili cha magugu yaliyotolewa ziwani.",
        "Kama mzigo ulipita ukaguzi wa ana kwa ana wa ubora.",
        "Bidhaa za thamani zilizotengenezwa (kama gesi ya kupikia, mikeka, mkaa mbadala, au mbolea ya kilimo).",
        "Uthibitisho kwamba wavunaji walilipwa.",
        "Uthibitisho kwamba rekodi haijaghushiwa au kubadilishwa.",
        "Ushahidi wa wazi kwa wanasayansi, wafadhili, na jamii nzima.",
      ],
      trustTitle: "Mambo ambayo rekodi hii inaweza (na haiwezi) kuthibitisha.",
      canTellTitle: "Inachoweza kuthibitisha",
      canTellDesc:
        "Inathibitisha kwamba taarifa iliyo kwenye cheti inalingana kikamilifu na kumbukumbu ya kudumu iliyofungwa wakati kazi ilipofanyika. Hakuna mtu anayeweza kubadilisha nambari baadaye.",
      cannotProveTitle: "Isichoweza kuthibitisha peke yake",
      cannotProveDesc:
        "Rekodi ya kompyuta inaonyesha kile ambacho watu wanaoaminika waliripoti na kusaini, lakini kompyuta haiwezi kwenda ziwani yenyewe. Ndio maana wakaguzi wa binadamu hukagua magugu halisi ufukweni.",
      ctaBannerTitle: "Je, una cheti au msimbo wa mkusanyiko?",
      ctaBannerDesc:
        "Changanua msimbo wake wa QR au weka msimbo ili uone uzito uliovunwa, matokeo ya ukaguzi, na safari ya uzalishaji.",
      ctaBannerBtn: "Kagua cheti",
    },
    verify: {
      headerTitle: "Kagua cheti cha mkusanyiko",
      headerDesc: "Weka msimbo ulio kwenye cheti au fungua kiungo chake kuona kilichotokea kwa mzigo wa gugu maji.",
      openCardTitle: "Tafuta cheti",
      openCardDesc1:
        "Changanua msimbo wa QR kwenye cheti au weka msimbo wake mfupi hapa chini ili upate historia yake yote.",
      openCardDesc2: "Unataka kujaribu kwanza? Bofya mifano ya majaribio hapa chini.",
      searchPlaceholder: "Weka msimbo (mfano EHCQJ-3GMNQ) au utambulisho wa mzigo…",
      btnSearch: "Tafuta",
      demoExamplesTitle: "Jaribu mifano hii kuona jinsi mfumo unavyofanya kazi:",
      advancedJsonTitle: "Kwa watengenezaji: Weka au bandika data ya cheti",
      codeCardTitle: "Msimbo wa cheti na kiungo cha kushiriki",
      missingDownstreamNotice: "Hatua za baadaye (kama kubadilisha magugu kuwa nishati, mbolea, au mikeka) hazijarekodiwa bado kwa mzigo huu wa hivi karibuni.",
      moreWaysSummary: "Njia zaidi za kukagua rekodi",
      pasteLabel: "Bandika faili au data ya cheti (JSON)",
      pastePlaceholder: "Bandika maelezo ya cheti hapa…",
      pasteHelp: "Chaguo hili ni kwa watengenezaji na majaribio ya ndani.",
      btnCheck: "Kagua cheti",
      btnChooseFile: "Chagua faili",
      demoHeader: "Mifano ya majaribio",
      demoWorking: "Mzigo Uliothibitishwa",
      demoRejected: "Mzigo Uliokataliwa (Matope)",
      demoChanged: "Nambari Zilizoghushiwa",
      demoCorrected: "Kosa Lililosahihishwa",
      demoRepeated: "Picha Iliyorudiwa",
      demoBadge: "Rekodi ya Jaribio",
      demoRecordNotice: "Mfano wa majaribio (Data ya mfano kwenye Base Sepolia)",
      statusCheckingTitle: "Inakagua rekodi hii",
      statusCheckingDesc: "Inathibitisha cheti na kumbukumbu yake ya kudumu kwenye kivinjari chako…",
      glanceTitle: "Muhtasari wa mzigo huu",
      harvestedLabel: "Kiasi kilichovunwa",
      harvestedDesc: "Kiasi cha gugu maji kilichotolewa kutoka ziwani.",
      progressLabel: "Hatua ya sasa",
      progressNote: "Inaonyesha safari ya mzigo huu ilipofikia hadi sasa.",
      rejectionTitle: "Kwanini mzigo huu ulisimamishwa",
      rejectionHeader: "Mkusanyiko huu haukufaulu ukaguzi wa ubora",
      rejectionRule:
        "Kwa sababu mzigo ulikataliwa kwenye ukaguzi (kwa mfano, kuwa na matope mengi au takataka), ulisimamishwa. Haukupata mikopo ya kazi na haukutumwa kuchakatwa.",
      amountsTitle: "Uzito na bidhaa zilizorekodiwa",
      amountsHarvested: "Uzito uliokusanywa",
      amountsAccepted: "Uzito uliokubaliwa",
      amountsProcessed: "Uzito uliochakatwa",
      amountsEndUse: "Bidhaa zilizotengenezwa",
      amountsDisclaimer:
        "Vipimo hivi vinatokana na ripoti zilizowekwa katika kila hatua na kufungwa kwenye daftari la kidijitali ili visiweze kubadilishwa.",
      timelineTitle: "Ratiba ya safari ya mzigo",
      timelineEmpty: "Bado hakuna hatua zilizorekodiwa.",
      thingsTitle: "Taarifa zilizotambuliwa kwa ukaguzi zaidi",
      creditsTitle: "Mikopo ya kazi ya jamii na mazingira",
      creditsDesc:
        "Mikopo ya kazi ni beji za kidijitali zinazothibitisha kazi halisi ya mazingira ilikamilika. Sio fedha na haziwezi kutumika kama pesa.",
      creditsRecordedSuffix: "mikopo iliyopatikana",
      techTitle: "Maelezo ya kiufundi na mnyororo (kwa wataalamu na wakaguzi)",
      badgeMatched: "imethibitishwa",
      badgeNotMatched: "hailingani",
      badgeLookCloser: "inahitaji ukaguzi",
      copy: "Nakili",
      copied: "Imenakiliwa!",
      notAvailable: "Haijarekodiwa bado",
      certificateCode: "Msimbo wa cheti",
      batchId: "Utambulisho wa mzigo",
      contract: "Mkataba wa Kidijitali (Smart Contract)",
      chain: "Mtandao wa Mnyororo (Blockchain)",
      paymentRef: "Kumbukumbu ya malipo",
      qrTitle: "Changanua kwa simu kufungua cheti hiki",
      qrDesc:
        "Mtu yeyote anaweza kuchanganua msimbo huu wa QR kwa kamera ya simu ili kufungua na kukagua cheti hiki moja kwa moja.",
      qrCopyLink: "Nakili kiungo cha cheti",
      qrLinkCopied: "Kiungo kimenakiliwa!",
      qrAlt: "Msimbo wa QR wa cheti hiki",
      dates: {
        collectedOn: "Ilivunwa tarehe",
        checkedOn: "Ilikaguliwa tarehe",
        acceptedOn: "Ilikubaliwa tarehe",
        settledOn: "Ililipwa tarehe",
        processedOn: "Ilichakatwa tarehe",
        putToUseOn: "Ilitumiwa tarehe",
      },
    },
    footer: {
      tagline:
        "Chombo cha wazi kwa umma kuthibitisha usafi wa Ziwa Victoria na kufuata magugu kutoka ziwani hadi kuwa bidhaa zenye manufaa.",
      disclaimer:
        "Rekodi ya kidijitali inathibitisha kwamba nambari zinalingana na kumbukumbu ya kudumu katika kila hatua. Wakaguzi wa kibinadamu wanathibitisha mimea halisi ufukweni.",
      home: "Nyumbani",
      howItWorks: "Jinsi inavyofanya kazi",
      checkRecord: "Kagua cheti",
      copyright: "© 2026 ZiwaChain",
    },
  },
};

/**
 * Format timestamp into localized readable date string.
 */
export function formatLocaleDate(dateStrOrTimestamp: string | number | undefined, lang: Language): string {
  if (!dateStrOrTimestamp || dateStrOrTimestamp === "-" || dateStrOrTimestamp === "Not recorded") {
    return translations[lang].verify.notAvailable;
  }

  if (typeof dateStrOrTimestamp === "string" && isNaN(Number(dateStrOrTimestamp))) {
    const parsed = Date.parse(dateStrOrTimestamp);
    if (!isNaN(parsed)) {
      return new Intl.DateTimeFormat(lang === "sw" ? "sw-KE" : "en-KE", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(parsed));
    }
    return dateStrOrTimestamp;
  }

  const sec = typeof dateStrOrTimestamp === "string" ? Number(dateStrOrTimestamp) : dateStrOrTimestamp;
  const ms = sec > 1e11 ? sec : sec * 1000;
  return new Intl.DateTimeFormat(lang === "sw" ? "sw-KE" : "en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ms));
}

/**
 * Translate dynamic verification status banner copy.
 */
export function getStatusBannerCopy(
  status: "loading" | "verified" | "failed" | "rejected",
  statusText: string,
  rejectionReason: string | undefined,
  lang: Language
): { label: string; text: string; icon: string } {
  if (status === "verified") {
    return lang === "sw"
      ? {
          label: "Kila kitu kimekaguliwa na kuthibitishwa.",
          text: "Taarifa zilizo kwenye cheti hiki zinalingana na kumbukumbu ya kudumu iliyofungwa katika kila hatua. Nambari hazijabadilishwa au kuchezewa.",
          icon: "✓",
        }
      : {
          label: "All records match and are verified.",
          text: "The certificate details match the permanent, locked record created at each step. The numbers have not been altered or faked.",
          icon: "✓",
        };
  }

  if (status === "rejected") {
    const swReason = rejectionReason
      ? rejectionReason.toLowerCase().includes("mud") || rejectionReason.toLowerCase().includes("contamination")
        ? "Matope mengi na uchafu usio wa kibaolojia uliovuka kiwango kinachoruhusiwa."
        : rejectionReason
      : "";

    return lang === "sw"
      ? {
          label: "Mavuno haya yalikataliwa kwenye ukaguzi.",
          text: rejectionReason
            ? `Rekodi ya kidijitali ni ya kweli, lakini mzigo ulikataliwa wakati wa ukaguzi wa ana kwa ana ufukweni: ${swReason} Haukupewa mikopo ya kazi.`
            : "Rekodi ya kidijitali ni ya kweli, lakini mzigo haukufaulu ukaguzi wa ubora ufukweni.",
          icon: "!",
        }
      : {
          label: "This harvest was inspected and rejected.",
          text: rejectionReason
            ? `The digital record is authentic, but the plants were rejected during in-person inspection on the beach: ${rejectionReason} No green work credits were issued.`
            : "The digital record is authentic, but the harvest did not pass physical quality inspection on the beach.",
          icon: "!",
        };
  }

  if (status === "failed") {
    const isInvalid = statusText.includes("Invalid") || statusText.includes("could not read");
    const isRpc = statusText.includes("RPC") || statusText.includes("network") || statusText.includes("blockchain");

    if (lang === "sw") {
      return {
        label: "Cheti hiki hakikuweza kuthibitishwa.",
        text: isInvalid
          ? "Hatukuweza kusoma cheti hiki. Tafadhali hakiki kiungo au faili kisha ujaribu tena."
          : isRpc
            ? "Mawasiliano na mtandao wa mnyororo yalishindwa kwa muda. Alama za usalama za cheti zinalingana, lakini uthibitisho wa mtandao haujakamilika."
            : "Nambari au maelezo ya cheti hiki hayalingani na rekodi ya kudumu. Huenda yamebadilishwa au kugushiwa.",
        icon: "×",
      };
    }

    return {
      label: "This certificate could not be verified.",
      text: isInvalid
        ? "We could not read this certificate. Please check the link or file and try again."
        : isRpc
          ? "Live network check was temporarily unable to reach the blockchain. Local cryptographic checks passed, but live confirmation is pending."
          : "The details on this certificate do not match the locked record. The numbers may have been altered or faked.",
      icon: "×",
    };
  }

  return lang === "sw"
    ? {
        label: "Inakagua rekodi hii",
        text: "Inathibitisha cheti na kumbukumbu yake ya kudumu kwenye kivinjari chako…",
        icon: "…",
      }
    : {
        label: "Checking this record",
        text: "Verifying the certificate and its permanent digital record in your browser…",
        icon: "…",
      };
}

/**
 * Translate dynamic check titles and descriptions.
 */
export function getTranslatedCheck(
  check: { title: string; status: "pass" | "fail" | "notice"; description: string },
  lang: Language
): { title: string; status: "pass" | "fail" | "notice"; description: string } {
  if (lang === "en") {
    if (check.title.includes("Duplicate Evidence")) {
      return {
        ...check,
        title: "Notice: Same photo or file used on another batch",
        description:
          check.description ||
          "A photo or proof file for this batch was also recorded on another batch. This is flagged for human review to avoid double-counting.",
      };
    }
    if (check.title.includes("Record Supersession") || check.title.includes("Correction")) {
      return {
        ...check,
        title: "A typo was corrected on record",
        description:
          check.description ||
          "An earlier record had a mistake (like a typo) and was formally updated with a recorded explanation.",
      };
    }
    if (check.title.includes("Settlement")) {
      return {
        ...check,
        title: "Harvester payment confirmed",
        description: check.description || "Harvester payment was confirmed on the ledger via phone SMS receipt.",
      };
    }
    if (check.title.includes("Payment Reference")) {
      return {
        ...check,
        title: "Harvester payment confirmed",
        description:
          "The record confirms payment was logged for the harvesting group via mobile money.",
      };
    }
    if (check.title.includes("Mass Balance") || check.title.includes("Conservation of Mass")) {
      return {
        ...check,
        title: "Weights and math add up",
        description:
          check.description ||
          "The amount of finished products (fuel, fertilizer, mats, etc.) balances with the amount of fresh weeds pulled from the lake.",
      };
    }
    if (check.title.includes("Work Credits")) {
      return {
        ...check,
        title: "Work credits match the work done",
        description: check.description || "The work credits recorded accurately reflect the verified products and environmental work produced.",
      };
    }
    if (check.title.includes("Pseudonym")) {
      return {
        ...check,
        title: "Harvester group ID matches",
        description: "The certificate links to the correct harvesting team while protecting individual privacy.",
      };
    }
    if (check.title.includes("Hash") || check.title.includes("Cryptographic")) {
      return {
        ...check,
        title: "Digital seal is intact",
        description: "The unique digital fingerprint matches the original record. Nothing was changed.",
      };
    }
    if (check.title.includes("Event Provenance")) {
      return {
        ...check,
        title: "Full timeline confirmed",
        description: "Every step from harvest to beneficial product is logged in the right order on the public ledger.",
      };
    }
    return check;
  }

  // Kiswahili
  if (check.title.includes("Duplicate Evidence")) {
    return {
      ...check,
      title: "Tanbihi: Ushahidi ule ule ulitumiwa kwenye mzigo mwingine",
      description:
        "Picha au faili ya ushahidi ya mzigo huu ilirekodiwa pia kwenye mzigo mwingine. Hii inatengwa ili ikaguliwe na binadamu kuzuia kuhesabu mara mbili.",
    };
  }
  if (check.title.includes("Record Supersession") || check.title.includes("Correction")) {
    return {
      ...check,
      title: "Kosa la uandishi lilisahihishwa",
      description:
        "Rekodi ya awali ilikuwa na kosa na ilirekebishwa rasmi kwa kuweka maelezo ya kile kilichobadilika.",
    };
  }
  if (check.title.includes("Settlement")) {
    return {
      ...check,
      title: "Malipo ya wavunaji yamethibitishwa",
      description: "Risiti ya malipo ya wavunaji imethibitishwa kwenye mnyororo kupitia ujumbe wa simu.",
    };
  }
  if (check.title.includes("Payment Reference")) {
    return {
      ...check,
      title: "Malipo ya wavunaji yamethibitishwa",
      description:
        "Rekodi inathibitisha kuwa malipo ya wavunaji yalifanyika na kuwekwa kwenye kumbukumbu.",
    };
  }
  if (check.title.includes("Mass Balance") || check.title.includes("Conservation of Mass")) {
    return {
      ...check,
      title: "Uzito na hesabu zinalingana vizuri",
      description:
        "Kiasi cha bidhaa zilizotengenezwa (nishati, mbolea, mikeka, n.k.) kinalingana vizuri na uzito wa magugu yaliyotolewa ziwani.",
    };
  }
  if (check.title.includes("Work Credits")) {
    return {
      ...check,
      title: "Mikopo ya kazi inalingana na kazi iliyofanyika",
      description: "Mikopo ya kazi ya jamii inaendana kikamilifu na bidhaa na kazi halisi ya mazingira iliyozalishwa.",
    };
  }
  if (check.title.includes("Pseudonym")) {
    return {
      ...check,
      title: "Utambulisho wa kikundi cha uvunaji unalingana",
      description: "Cheti kinalingana na kikundi sahihi cha wavunaji huku kikiweka majina binafsi kuwa ya siri.",
    };
  }
  if (check.title.includes("Hash") || check.title.includes("Cryptographic")) {
    return {
      ...check,
      title: "Muhuri wa kidijitali uko salama",
      description: "Alama ya kipekee ya kidijitali inalingana na rekodi ya awali. Hakuna kilichobadilishwa.",
    };
  }
  if (check.title.includes("Event Provenance")) {
    return {
      ...check,
      title: "Ratiba nzima ya hatua imethibitishwa",
      description: "Kila hatua kuanzia kuvuna hadi kuwa bidhaa imerekodiwa kwa mfuatano sahihi kwenye mnyororo.",
    };
  }

  return {
    ...check,
    title: check.title,
    description: check.description,
  };
}

/**
 * Translate dynamic timeline title & details.
 */
export function getTranslatedTimeline(
  title: string,
  details: string,
  lang: Language
): { title: string; details: string } {
  if (lang === "en") {
    let enTitle = title;
    let enDetails = details;
    if (title.includes("Collection recorded") || title.includes("HARVEST")) {
      enTitle = title.replace("Collection recorded —", "Weeds harvested from lake —").replace("Collection recorded", "Weeds harvested from lake");
      enDetails = details.replace("collected and logged into the system.", "harvested and weighed at the shore.");
    } else if (title.includes("Collection approved") || title.includes("VERIFIED")) {
      if (title.includes("rejected") || details.toLowerCase().includes("rejected") || details.toLowerCase().includes("did not approve")) {
        enTitle = "Harvest rejected during inspection";
        enDetails = details
          .replace("Inspection did not approve this lot:", "Inspection did not approve this harvest:")
          .replace("Collection did not pass physical quality inspection.", "The harvest contained too much mud or foreign debris.")
          .replace("Excessive mud and inorganic contamination exceeding threshold.", "Excessive mud and non-plant debris above allowed limits.");
      } else {
        enTitle = "Harvest inspected & approved";
        enDetails = "Checked on the beach by an independent inspector and verified clean.";
      }
    } else if (title.includes("Receiving party accepted") || title.includes("ACCEPTED")) {
      enTitle = title.replace("Receiving party accepted", "Workshop accepted");
      enDetails = details.replace("Receiving party accepted", "Workshop received").replace("for downstream processing.", "to turn into useful products (such as fuel, fertilizer, or woven mats).");
    } else if (title.includes("Payment confirmation recorded") || title.includes("SETTLEMENT")) {
      enTitle = "Harvester payment confirmed";
      enDetails = "Payment to the harvesting group was confirmed via phone SMS receipt.";
    } else if (title.includes("processed") || title.includes("PROCESSED")) {
      enTitle = title.replace("processed", "turned into useful products");
      enDetails = details.replace("processed into", "converted into").replace("output units", "units");
    } else if (title.includes("recorded as put to use") || title.includes("END_USE") || title.includes("End Use")) {
      enTitle = title.replace("recorded as put to use", "delivered for beneficial use");
      enDetails = details.replace("converted into", "delivered and used for");
    } else if (title.includes("Record corrected") || title.includes("CORRECTED")) {
      enTitle = "Earlier typo corrected on record";
      enDetails = "A spelling or typing mistake in the earlier record was updated with an explanation.";
    }
    return { title: enTitle, details: enDetails };
  }

  // Kiswahili translation
  let swTitle = title;
  let swDetails = details;

  if (title.includes("Collection recorded") || title.includes("HARVEST")) {
    swTitle = title
      .replace("Collection recorded —", "Magugu yamevunwa ziwani —")
      .replace("Collection recorded", "Magugu yamevunwa ziwani")
      .replace(/HARVEST.*$/, "Magugu yamevunwa ziwani");
    swDetails = details
      .replace("collected in", "zilizovunwa katika eneo la")
      .replace("collected and logged into the system.", "zilizovunwa na kupimwa ufukweni.")
      .replace("and logged into the system.", "na kupimwa ufukweni.");
  } else if (title.includes("Collection approved") || title.includes("VERIFIED")) {
    if (title.includes("rejected") || details.toLowerCase().includes("rejected") || details.toLowerCase().includes("did not approve")) {
      swTitle = "Mavuno yalikataliwa kwenye ukaguzi";
      swDetails = details
        .replace("Inspection did not approve this lot:", "Ukaguzi haukuidhinisha mzigo huu:")
        .replace("Excessive mud and inorganic contamination exceeding threshold.", "Matope mengi na uchafu usio wa kibaolojia uliovuka kiwango kinachoruhusiwa.")
        .replace("Collection did not pass physical quality inspection.", "Mzigo ulikuwa na matope mengi au takataka.");
    } else {
      swTitle = "Mavuno yalikaguliwa na kuidhinishwa";
      swDetails = "Yalikaguliwa ufukweni na mkaguzi huru na kuthibitishwa kuwa safi.";
    }
  } else if (title.includes("Receiving party accepted") || title.includes("ACCEPTED")) {
    swTitle = title
      .replace("Receiving party accepted", "Kiwanda kilipokea")
      .replace(/BUYER_ACCEPTED.*$/, "Kiwanda kilipokea");
    swDetails = details
      .replace("Receiving party accepted", "Kiwanda kilipokea")
      .replace("for downstream processing.", "ili kugeuza kuwa bidhaa zenye manufaa (kama nishati, mbolea, au mikeka).");
  } else if (title.includes("Payment confirmation recorded") || title.includes("SETTLEMENT")) {
    swTitle = "Malipo ya wavunaji yamethibitishwa";
    swDetails = "Malipo ya wavunaji yalithibitishwa kupitia risiti ya ujumbe wa simu.";
  } else if (title.includes("processed") || title.includes("PROCESSED")) {
    swTitle = title.replace("processed", "yaligeuzwa kuwa bidhaa za thamani").replace(/PROCESSED.*$/, "Uchakataji ulirekodiwa");
    swDetails = details
      .replace("processed into", "yaligeuzwa kuwa")
      .replace("output units", "vizio");
  } else if (title.includes("recorded as put to use") || title.includes("END_USE") || title.includes("End Use")) {
    swTitle = title.replace("recorded as put to use", "yalipelekwa kutumika kwa manufaa").replace(/END_USE.*$/, "Matumizi yenye manufaa yalirekodiwa");
    swDetails = details
      .replace("converted into", "yalipelekwa na kutumika kwa ajili ya")
      .replace("output units", "vizio");
  } else if (title.includes("Record corrected") || title.includes("CORRECTED")) {
    swTitle = "Kosa la awali lilisahihishwa";
    swDetails = "Kosa la uandishi katika rekodi ya awali lilisahihishwa pamoja na maelezo.";
  }

  return { title: swTitle, details: swDetails };
}

/**
 * Translate dynamic mass balance status string.
 */
export function getTranslatedMassStatus(status: string, lang: Language): string {
  if (!status) return "";
  if (lang === "en") {
    if (status.includes("warning") || status.includes("Violated") || status.includes("violated")) {
      return "⚠️ Notice: The reported weights do not add up! More finished products were reported than the raw plants received.";
    }
    if (status.includes("fit together") || status.includes("Preserved") || status.includes("Satisfied") || status.includes("holds")) {
      return status
        .replace("The recorded amounts fit together:", "✓ The weights add up:")
        .replace("collected", "harvested")
        .replace("accepted", "approved")
        .replace("processed", "processed")
        .replace("recorded as put to use", "turned into useful products");
    }
    if (status.includes("rejected")) {
      return "This harvest was rejected during beach inspection. No further processing took place.";
    }
    if (status.includes("not yet recorded") || status.includes("not recorded yet")) {
      return status
        .replace("Collection recorded", "Harvest logged")
        .replace("Subsequent processing stages are not recorded yet.", "Processing into useful products has not been logged yet.")
        .replace("Subsequent processing stages are not yet recorded.", "Processing into useful products has not been logged yet.");
    }
    return status;
  }

  // Kiswahili
  if (status.includes("warning") || status.includes("Violated") || status.includes("violated")) {
    return "⚠️ Tahadhari: Vipimo vilivyoripotiwa havilingani! Kiasi cha bidhaa kilichoripotiwa ni kikubwa kuliko magugu yaliyopokelewa.";
  }
  if (status.includes("fit together") || status.includes("Preserved") || status.includes("Satisfied") || status.includes("holds")) {
    return status
      .replace("The recorded amounts fit together:", "✓ Vipimo vinalingana vizuri:")
      .replace("collected", "zilizovunwa")
      .replace("accepted", "zilizokubaliwa")
      .replace("processed", "zilizochakatwa")
      .replace("recorded as put to use", "zilizotumika kwa bidhaa zenye manufaa");
  }
  if (status.includes("rejected")) {
    return "Mzigo huu ulikataliwa wakati wa ukaguzi ufukweni. Hakuna uchakataji zaidi uliofanyika.";
  }
  if (status.includes("not yet recorded") || status.includes("not recorded yet")) {
    return status
      .replace("Collection recorded", "Mavuno yamelogwa")
      .replace("Subsequent processing stages are not recorded yet.", "Kuchakatwa kuwa bidhaa zenye manufaa hakujarekodiwa bado.")
      .replace("Subsequent processing stages are not yet recorded.", "Kuchakatwa kuwa bidhaa zenye manufaa hakujarekodiwa bado.");
  }
  return status;
}

/**
 * Translate stage name badge.
 */
export function getTranslatedStageName(stage: string, lang: Language): string {
  const lower = stage.toLowerCase();
  if (lang === "en") {
    if (lower.includes("rejected")) return "Rejected";
    if (lower.includes("harvest")) return "Weed Harvested";
    if (lower.includes("verif")) return "Quality Approved";
    if (lower.includes("accept")) return "Workshop Accepted";
    if (lower.includes("settle")) return "Payment Confirmed";
    if (lower.includes("process")) return "Turned to Products";
    if (lower.includes("end")) return "Put to Beneficial Use";
    if (lower.includes("record")) return "Logged";
    if (lower.includes("checking")) return "Verifying...";
    return stage;
  }

  // Kiswahili
  if (lower.includes("rejected")) return "Imekataliwa";
  if (lower.includes("harvest")) return "Imevunwa Ziwani";
  if (lower.includes("verif")) return "Ubora Umeidhinishwa";
  if (lower.includes("accept")) return "Imepokelewa Kiwandani";
  if (lower.includes("settle")) return "Malipo Yamethibitishwa";
  if (lower.includes("process")) return "Imegeuzwa Kuwa Bidhaa";
  if (lower.includes("end")) return "Imetumika kwa Manufaa";
  if (lower.includes("record")) return "Imerekodiwa";
  if (lower.includes("checking")) return "Inathibitisha...";
  return stage;
}
