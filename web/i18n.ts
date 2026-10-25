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
      brandSubtitle: "Records for collected water hyacinth",
      home: "Home",
      howItWorks: "How it works",
      checkRecord: "Check a record",
      openMenu: "Open navigation menu",
      closeMenu: "Close navigation menu",
      themeLight: "Switch to light mode",
      themeDark: "Switch to dark mode",
      langEnglish: "English",
      langSwahili: "Kiswahili",
    },
    home: {
      heroBadge: "A clearer record of environmental work",
      heroTitle: "Follow the journey of collected water hyacinth.",
      heroDesc:
        "When water hyacinth is collected, different people may handle it before it is put to use. ZiwaChain helps keep a record of what happens along the way, so people can see what has been reported and check the saved information.",
      heroCtaCheck: "Check a record",
      heroCtaHow: "How it works",
      journeyTitle: "A simple view of a collection record's journey",
      journeySubtitle: "Select any step to explore what happens at that stage:",
      journeyDisclaimer:
        "A simple view of the steps a record may contain. Not a report of a particular collection.",
      journeySteps: [
        {
          id: "harvest",
          label: "Collection recorded",
          detail:
            "The system records the amount of water hyacinth reported as collected at the landing site, with harvester group identity and GPS hotspot references.",
        },
        {
          id: "verified",
          label: "Collection checked",
          detail:
            "An authorised verifier inspects the harvested batch for foreign contamination and confirms or rejects the record on-chain.",
        },
        {
          id: "processed",
          label: "Amount received and processed",
          detail:
            "A receiving processor records how much mass is accepted, converted into biogas or biochar, and put to beneficial end-use under strict mass-balance limits.",
        },
        {
          id: "available",
          label: "Record available to check",
          detail:
            "Anyone can inspect the tamper-evident certificate, verify cryptographic hashes, and confirm on-chain status independently.",
        },
      ],
      whyTitle: "Why keep a record?",
      whyP1:
        "Collecting water hyacinth is only one part of the story. Someone may receive it, another person may process it, and someone else may put it to use.",
      whyP2:
        "Without clear records, it can be difficult to follow what happened at each step. ZiwaChain is designed to make those steps easier to follow.",
      howBadge: "How it works",
      howTitle: "Four simple steps.",
      howSteps: [
        {
          step: "01",
          title: "A collection is recorded",
          summary: "The system records the amount of water hyacinth reported as collected.",
          detail:
            "Harvesters submit collection records via lightweight digital tools or SMS co-signing, generating an initial cryptographic batch fingerprint that seals the harvest details.",
        },
        {
          step: "02",
          title: "The collection is checked",
          summary: "An authorised person can approve or reject the record.",
          detail:
            "Field verifiers assess organic purity and scale weight. Batches containing excessive inorganic mud or contaminants are formally rejected and permanently withheld from credit issuance.",
        },
        {
          step: "03",
          title: "The journey is recorded",
          summary: "The system records how much was accepted, processed, and put to use.",
          detail:
            "Processors document biogas, briquette, or compost conversion, enforcing strict conservation of mass so reported outputs never exceed authenticated inputs.",
        },
        {
          step: "04",
          title: "People can check the record",
          summary: "A certificate lets someone inspect the saved information about the collection.",
          detail:
            "Public certificates contain verifiable cryptographic fingerprints, Base Sepolia blockchain transaction links, and exact timestamps that anyone can check without a middleman.",
        },
      ],
      readMore: "Learn more",
      readLess: "Show less",
      valueTitle: "One record. A clearer picture of what happened.",
      valueItems: [
        "How much was reported as collected.",
        "How much was accepted and processed.",
        "How much was recorded as put to use.",
        "Whether the collection was approved or rejected.",
        "Whether a payment confirmation was recorded.",
        "Whether the digital details match saved records.",
      ],
      trustTitle: "What a digital record can and cannot tell you.",
      canTellTitle: "What it can tell you",
      canTellDesc:
        "The system can check whether the information on a certificate matches the digital records saved for it.",
      cannotProveTitle: "What it cannot prove by itself",
      cannotProveDesc:
        "A matching digital record does not, on its own, prove that every real-world event happened exactly as described.",
      ctaBannerTitle: "Have a collection certificate?",
      ctaBannerDesc:
        "Open its certificate or enter its code to see what has been recorded and check the digital details.",
      ctaBannerBtn: "Check a record",
    },
    verify: {
      headerTitle: "Check a collection record",
      headerDesc: "Enter the code on a certificate, or open the certificate link you were given.",
      openCardTitle: "Open the certificate link",
      openCardDesc1:
        "Open the certificate link you received or scan its QR code. The record will open here automatically.",
      openCardDesc2: "If you are testing or have the certificate file, use the extra options below.",
      moreWaysSummary: "More ways to check a record",
      pasteLabel: "Paste the certificate file (JSON)",
      pastePlaceholder: "Paste certificate details here…",
      pasteHelp: "This option is mainly for developers and local testing.",
      btnCheck: "Check record",
      btnChooseFile: "Choose file",
      demoHeader: "Local demonstrations",
      demoWorking: "Working example",
      demoRejected: "Rejected example",
      demoChanged: "Changed example",
      demoCorrected: "Corrected example",
      demoRepeated: "Repeated evidence",
      demoBadge: "Demo Record",
      demoRecordNotice: "Synthetic testnet demonstration record (Base Sepolia)",
      statusCheckingTitle: "Checking this record",
      statusCheckingDesc: "We are checking the certificate and its saved digital records in your browser…",
      glanceTitle: "Batch at a glance",
      harvestedLabel: "What is this collection?",
      harvestedDesc: "This is the amount collected, as written in the certificate.",
      progressLabel: "Current progress",
      progressNote: "Only recorded steps are shown.",
      rejectionTitle: "Rejection outcome",
      rejectionHeader: "Collection rejected at physical verification",
      rejectionRule:
        "Under ZiwaChain protocol rules, stage Rejected is terminal. Commercial certificate of custody is withheld and 0 work credits were issued. Later stages were not completed.",
      amountsTitle: "Amounts recorded",
      amountsHarvested: "Amount collected",
      amountsAccepted: "Amount accepted",
      amountsProcessed: "Amount processed",
      amountsEndUse: "Amount put to use",
      amountsDisclaimer:
        "These amounts come from the saved record. They do not prove by themselves that a photograph or physical weighing is true.",
      timelineTitle: "What happened next?",
      timelineEmpty: "No steps have been recorded yet.",
      thingsTitle: "Things to look at",
      creditsTitle: "Work credits",
      creditsDesc:
        "Work credits are digital records linked to qualifying work recorded by this system. They are not money and are not carbon credits.",
      creditsRecordedSuffix: "work credits recorded",
      techTitle: "More details for people who want to check further",
      badgeMatched: "matched",
      badgeNotMatched: "does not match",
      badgeLookCloser: "look closer",
      copy: "Copy",
      copied: "Copied!",
      notAvailable: "Not recorded",
      certificateCode: "Certificate code",
      batchId: "Batch ID",
      contract: "Contract",
      chain: "Chain",
      paymentRef: "Payment reference",
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
        "A public way to inspect records about collected water hyacinth and what happened at each recorded step.",
      disclaimer:
        "A digital match shows that information agrees with saved records. It cannot prove that every real-world activity happened exactly as described.",
      home: "Home",
      howItWorks: "How it works",
      checkRecord: "Check a record",
      copyright: "© 2026 ZiwaChain",
    },
  },
  sw: {
    nav: {
      brandSubtitle: "Kumbukumbu za gugu maji lililokusanywa",
      home: "Nyumbani",
      howItWorks: "Jinsi inavyofanya kazi",
      checkRecord: "Kagua rekodi",
      openMenu: "Fungua menyu kuu",
      closeMenu: "Funga menyu kuu",
      themeLight: "Washa hali ya mwangaza",
      themeDark: "Washa hali ya giza",
      langEnglish: "English",
      langSwahili: "Kiswahili",
    },
    home: {
      heroBadge: "Kumbukumbu bayana ya kazi ya mazingira",
      heroTitle: "Fuatilia kilichotokea kwa gugu maji lililokusanywa.",
      heroDesc:
        "Gugu maji linapokusanywa, watu mbalimbali hulishughulikia kabla ya kutumika. ZiwaChain huweka rekodi ya hatua zote njiani, ili kila mtu aone kilichoripotiwa na kukagua taarifa zilizohifadhiwa.",
      heroCtaCheck: "Kagua rekodi",
      heroCtaHow: "Jinsi inavyofanya kazi",
      journeyTitle: "Taswira rahisi ya safari ya rekodi ya mkusanyiko",
      journeySubtitle: "Bofya hatua yoyote hapa chini ili uone kinachofanyika:",
      journeyDisclaimer:
        "Mtazamo rahisi wa hatua zinazoweza kuwemo kwenye rekodi. Sio ripoti ya mkusanyiko maalum.",
      journeySteps: [
        {
          id: "harvest",
          label: "Mkusanyiko unarekodiwa",
          detail:
            "Mfumo huandika kiasi cha gugu maji kilichoripotiwa kuvunwa katika kituo cha kutua, pamoja na utambulisho wa kikundi cha wavunaji na eneo la GPS.",
        },
        {
          id: "verified",
          label: "Mkusanyiko unakaguliwa",
          detail:
            "Mkaguzi aliyeidhinishwa hukagua mzigo uliovunwa kubaini iwapo una uchafu au matope na kuthibitisha au kukataa rekodi kwenye mnyororo.",
        },
        {
          id: "processed",
          label: "Kiasi kupokelewa na kuchakatwa",
          detail:
            "Mchakataji anayepokea hurekodi kiasi alichokubali, kilichobadilishwa kuwa bayogasi au mkaa mbadala, na kutumika chini ya viwango sahihi vya uwiano wa uzito.",
        },
        {
          id: "available",
          label: "Rekodi kupatikana kwa ukaguzi",
          detail:
            "Mtu yeyote anaweza kukagua cheti hiki, kuthibitisha saini za siri za kidijitali, na kuhakiki hali halisi kwenye mnyororo wa data.",
        },
      ],
      whyTitle: "Kwa nini kuweka rekodi?",
      whyP1:
        "Kukusanya gugu maji ni sehemu moja tu ya safari. Mtu anaweza kulipokea, mwingine akalichakata, na mwingine akalitumia kwa manufaa.",
      whyP2:
        "Bila kumbukumbu zilizo wazi, ni vigumu kufuatilia kilichojiri kila hatua. ZiwaChain imeundwa kufanya hatua hizo ziwe rahisi kufuatiliwa na kila mtu.",
      howBadge: "Jinsi inavyofanya kazi",
      howTitle: "Hatua nne rahisi.",
      howSteps: [
        {
          step: "01",
          title: "Mkusanyiko unarekodiwa",
          summary: "Mfumo hurekodi kiasi cha gugu maji kilichoripotiwa kukusanywa.",
          detail:
            "Wavunaji hutuma taarifa za uvunaji kwa zana rahisi za kidijitali au kuthibitisha kwa SMS, na kutengeneza alama ya kipekee ya siri inayofunga taarifa za mavuno.",
        },
        {
          step: "02",
          title: "Mkusanyiko unakaguliwa",
          summary: "Mtu aliyeidhinishwa anaweza kuidhinisha au kukataa rekodi.",
          detail:
            "Wakaguzi nyanjani hupima uzito na usafi wa gugu maji. Mizigo iliyo na matope mengi au takataka hukataliwa rasmi na kuzuiliwa kupata mikopo ya kazi.",
        },
        {
          step: "03",
          title: "Safari inarekodiwa",
          summary: "Mfumo hurekodi kiasi kilichopokelewa, kuchakatwa na kutumika.",
          detail:
            "Wachakataji huweka kumbukumbu za uzalishaji wa bayogasi au mbolea, wakidumisha uwiano kamili wa uzito ili kiasi kinachotoka kisizidi kile kilichothibitishwa kupokelewa.",
        },
        {
          step: "04",
          title: "Watu wanaweza kukagua rekodi",
          summary: "Cheti kinamwezesha mtu kukagua taarifa zilizohifadhiwa kuhusu mkusanyiko.",
          detail:
            "Vyeti huwa na alama za siri za kidijitali zilizothibitishwa, viungo vya miamala kwenye mnyororo wa Base Sepolia, na nyakati kamili ambazo mtu yeyote anaweza kuthibitisha.",
        },
      ],
      readMore: "Soma zaidi",
      readLess: "Funga maelezo",
      valueTitle: "Rekodi moja. Taswira bayana ya kilichofanyika.",
      valueItems: [
        "Kiasi kilichoripotiwa kukusanywa.",
        "Kiasi kilichopokelewa na kuchakatwa.",
        "Kiasi kilichorekodiwa kuwa kimetumika.",
        "Ikiwa mkusanyiko uliidhinishwa au kukataliwa.",
        "Ikiwa uthibitisho wa malipo ulirekodiwa.",
        "Ikiwa maelezo ya kidijitali yanaendana na kumbukumbu.",
      ],
      trustTitle: "Mambo ambayo rekodi ya kidijitali inaweza na haiwezi kuthibitisha.",
      canTellTitle: "Inachoweza kuthibitisha",
      canTellDesc:
        "Mfumo unaweza kuthibitisha iwapo taarifa iliyo kwenye cheti inaendana kikamilifu na rekodi za kidijitali zilizohifadhiwa kwa ajili yake.",
      cannotProveTitle: "Isichoweza kuthibitisha peke yake",
      cannotProveDesc:
        "Kuendana kwa rekodi za kidijitali hakuthibitishi peke yake kwamba kila tukio halisi lilitokea sawasawa kama ilivyoelezwa.",
      ctaBannerTitle: "Je, una cheti cha mkusanyiko?",
      ctaBannerDesc:
        "Fungua cheti chake au weka msimbo wake ili uone kilichorekodiwa na kukagua taarifa za kidijitali.",
      ctaBannerBtn: "Kagua rekodi",
    },
    verify: {
      headerTitle: "Kagua rekodi ya mkusanyiko",
      headerDesc: "Weka msimbo ulio kwenye cheti, au fungua kiungo cha cheti ulichopewa.",
      openCardTitle: "Fungua kiungo cha cheti",
      openCardDesc1:
        "Fungua kiungo cha cheti ulichopokea au changanua msimbo wake wa QR. Rekodi itafunguka hapa kiotomatiki.",
      openCardDesc2: "Ikiwa unafanya majaribio au una faili ya cheti, tumia machaguo ya ziada hapa chini.",
      moreWaysSummary: "Njia zaidi za kukagua rekodi",
      pasteLabel: "Bandika faili ya cheti (JSON)",
      pastePlaceholder: "Bandika maelezo ya cheti hapa…",
      pasteHelp: "Chaguo hili ni maalum kwa watengenezaji na majaribio ya ndani.",
      btnCheck: "Kagua rekodi",
      btnChooseFile: "Chagua faili",
      demoHeader: "Mifano ya majaribio ya ndani",
      demoWorking: "Mfano uliothibitishwa",
      demoRejected: "Mfano uliokataliwa",
      demoChanged: "Mfano uliobadilishwa",
      demoCorrected: "Mfano uliosahihishwa",
      demoRepeated: "Ushahidi uliorudiwa",
      demoBadge: "Rekodi ya Jaribio",
      demoRecordNotice: "Rekodi ya mfano wa majaribio (Base Sepolia)",
      statusCheckingTitle: "Inakagua rekodi hii",
      statusCheckingDesc: "Tunaendelea kukagua cheti na rekodi zake za kidijitali kwenye kivinjari chako…",
      glanceTitle: "Muhtasari wa mzigo huu",
      harvestedLabel: "Mkusanyiko huu ni nini?",
      harvestedDesc: "Hiki ndicho kiasi kilichokusanywa, kama kilivyoandikwa kwenye cheti.",
      progressLabel: "Hatua ya sasa",
      progressNote: "Hatua zilizorekodiwa pekee ndizo zinaonyeshwa.",
      rejectionTitle: "Matokeo ya kukataliwa",
      rejectionHeader: "Mkusanyiko ulikataliwa wakati wa ukaguzi wa kimwili",
      rejectionRule:
        "Chini ya kanuni za itifaki ya ZiwaChain, hatua ya Kukataliwa ndiyo ya mwisho. Cheti cha kibiashara kinazuiliwa na mikopo 0 ya kazi imetolewa. Hatua za baadaye hazikukamilika.",
      amountsTitle: "Vipimo vilivyorekodiwa",
      amountsHarvested: "Kiasi kilichokusanywa",
      amountsAccepted: "Kiasi kilichopokelewa",
      amountsProcessed: "Kiasi kilichochakatwa",
      amountsEndUse: "Kiasi kilichorekodiwa kuwa kimetumika",
      amountsDisclaimer:
        "Vipimo hivi vinatokana na rekodi iliyohifadhiwa. Havitibitishi peke yake kwamba picha au upimaji halisi ni wa kweli.",
      timelineTitle: "Nini kilifanyika baadaye?",
      timelineEmpty: "Bado hakuna hatua zilizorekodiwa.",
      thingsTitle: "Mambo ya kuchunguza kwa makini",
      creditsTitle: "Mikopo ya kazi",
      creditsDesc:
        "Mikopo ya kazi ni rekodi za kidijitali zinazohusiana na kazi inayokidhi vigezo vya mfumo huu. Sio pesa na sio mikopo ya kaboni.",
      creditsRecordedSuffix: "mikopo ya kazi iliyorekodiwa",
      techTitle: "Maelezo zaidi kwa wanaotaka kuchunguza zaidi",
      badgeMatched: "imelingana",
      badgeNotMatched: "hailingani",
      badgeLookCloser: "chunguza zaidi",
      copy: "Nakili",
      copied: "Imenakiliwa!",
      notAvailable: "Bado haijarekodiwa",
      certificateCode: "Msimbo wa cheti",
      batchId: "Utambulisho wa mzigo (Batch ID)",
      contract: "Mkataba wa mnyororo",
      chain: "Mnyororo (Chain)",
      paymentRef: "Kumbukumbu ya malipo",
      dates: {
        collectedOn: "Kukusanywa tarehe",
        checkedOn: "Kukaguliwa tarehe",
        acceptedOn: "Kupokelewa tarehe",
        settledOn: "Kumalizika tarehe",
        processedOn: "Kuchakatwa tarehe",
        putToUseOn: "Kutumika tarehe",
      },
    },
    footer: {
      tagline:
        "Njia ya wazi ya umma kukagua kumbukumbu kuhusu gugu maji lililokusanywa na kilichotokea katika kila hatua iliyorekodiwa.",
      disclaimer:
        "Kulingana kwa taarifa za kidijitali kunaonyesha kuwa maelezo yanakubaliana na kumbukumbu zilizohifadhiwa. Hakuwezi kuthibitisha peke yake kuwa kila shughuli halisi ilifanyika sawasawa kama ilivyoelezwa.",
      home: "Nyumbani",
      howItWorks: "Jinsi inavyofanya kazi",
      checkRecord: "Kagua rekodi",
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

  // If already a formatted string that contains letters or dashes
  if (typeof dateStrOrTimestamp === "string" && isNaN(Number(dateStrOrTimestamp))) {
    // If it's like "2026-10-23 14:00"
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
          label: "Taarifa za kidijitali zinaendana.",
          text: "Taarifa zilizo kwenye cheti hiki zinaendana na kumbukumbu za kidijitali zilizohifadhiwa. Hii peke yake haiwezi kuthibitisha kwamba kila tukio halisi lilitokea sawasawa kama ilivyoelezwa.",
          icon: "✓",
        }
      : {
          label: "The digital details match.",
          text: "The information on this certificate matches the saved digital records. This cannot prove by itself that every real-world event happened exactly as described.",
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
          label: "Mkusanyiko huu haukuidhinishwa.",
          text: rejectionReason
            ? `Rekodi ya kidijitali ni halisi, lakini mkusanyiko ulikataliwa wakati wa ukaguzi wa kimwili: ${swReason} Mikopo ya kazi ilizuiliwa.`
            : "Rekodi ya kidijitali ni halisi, lakini mkusanyiko haukuidhinishwa ulipokaguliwa.",
          icon: "!",
        }
      : {
          label: "This collection was not approved.",
          text: rejectionReason
            ? `The digital record is authentic, but the collection was rejected during physical verification: ${rejectionReason} Work credits were withheld.`
            : "The digital record is authentic, but the collection was not approved when it was checked.",
          icon: "!",
        };
  }

  if (status === "failed") {
    const isInvalid = statusText.includes("Invalid") || statusText.includes("could not read");
    const isRpc = statusText.includes("RPC") || statusText.includes("network") || statusText.includes("blockchain");

    if (lang === "sw") {
      return {
        label: "Baadhi ya taarifa hazikuweza kuthibitishwa.",
        text: isInvalid
          ? "Hatukuweza kusoma cheti hiki. Tafadhali kagua kiungo au faili kisha ujaribu tena."
          : isRpc
            ? "Ukaguzi wa mkataba wa mnyororo haukuweza kukamilika kutokana na tatizo la mtandao au RPC. Alama za siri za cheti zimethibitishwa, lakini hali kwenye mnyororo haijathibitishwa."
            : "Hatukuweza kukagua kila sehemu ya rekodi hii. Baadhi ya taarifa bado hazijathibitishwa.",
        icon: "×",
      };
    }

    return {
      label: "Some details could not be confirmed.",
      text: isInvalid
        ? "We could not read this certificate. Check the link or file and try again."
        : isRpc
          ? "Live contract check could not run due to an RPC or network problem. Cryptographic hashes from the certificate were verified, but on-chain status is unconfirmed."
          : "We could not check every part of this record. Some information is still unconfirmed.",
      icon: "×",
    };
  }

  return lang === "sw"
    ? {
        label: "Inakagua rekodi hii",
        text: "Tunaendelea kukagua cheti na rekodi zake za kidijitali zilizohifadhiwa kwenye kivinjari chako…",
        icon: "…",
      }
    : {
        label: "Checking this record",
        text: "We are checking the certificate and its saved digital records in your browser…",
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
        title: "Something needs a closer look.",
        description:
          check.description ||
          "Some of the same digital evidence was also recorded for another collection. Shared evidence warrants review but does not automatically prove fraud.",
      };
    }
    if (check.title.includes("Record Supersession") || check.title.includes("Correction")) {
      return {
        ...check,
        title: "Earlier information was corrected.",
        description:
          check.description ||
          "An earlier digital record was replaced with a corrected one. Open the extra details to see what changed.",
      };
    }
    if (check.title.includes("Settlement")) {
      return {
        ...check,
        title: "Settlement confirmation recorded",
        description: check.description || "Harvester payment receipt confirmed on-chain via SMS co-sign.",
      };
    }
    if (check.title.includes("Payment Reference")) {
      return {
        ...check,
        title: "Payment confirmation",
        description:
          "The record says that payment was confirmed. This does not mean ZiwaChain independently checked the payment with M-Pesa.",
      };
    }
    if (check.title.includes("Mass Balance") || check.title.includes("Conservation of Mass")) {
      return {
        ...check,
        title: "The recorded amounts fit together.",
        description:
          check.description ||
          "The amounts recorded at each step do not exceed the amounts allowed by the system.",
      };
    }
    if (check.title.includes("Work Credits")) {
      return {
        ...check,
        title: "Work-credit record",
        description: check.description || "The work-credit record matches the recorded use of the material.",
      };
    }
    if (check.title.includes("Pseudonym")) {
      return {
        ...check,
        title: "Collection identity matches",
        description: "The certificate points to the same private collection identifier as the saved record.",
      };
    }
    if (check.title.includes("Hash") || check.title.includes("Cryptographic")) {
      return {
        ...check,
        title: "Certificate details match",
        description: "The certificate's digital fingerprint matches the saved record.",
      };
    }
    if (check.title.includes("Event Provenance")) {
      return {
        ...check,
        title: "Saved collection details match",
        description: "The saved record shows the same collection details.",
      };
    }
    return check;
  }

  // Kiswahili
  if (check.title.includes("Duplicate Evidence")) {
    return {
      ...check,
      title: "Baadhi ya taarifa zinahitaji kuchunguzwa zaidi.",
      description:
        "Sehemu ya ushahidi huo wa kidijitali ilirekodiwa pia kwa mkusanyiko mwingine. Ushahidi ulioshirikiwa unastahili ukaguzi lakini haumaanishi udanganyifu moja kwa moja.",
    };
  }
  if (check.title.includes("Record Supersession") || check.title.includes("Correction")) {
    return {
      ...check,
      title: "Taarifa za awali zilisahihishwa.",
      description:
        "Rekodi ya awali ya kidijitali ilibadilishwa na iliyosahihishwa. Fungua maelezo ya ziada kuona kilichobadilika.",
    };
  }
  if (check.title.includes("Settlement")) {
    return {
      ...check,
      title: "Uthibitisho wa malipo umerekodiwa",
      description: "Risiti ya malipo ya mvunaji imethibitishwa kwenye mnyororo kupitia ujumbe wa SMS.",
    };
  }
  if (check.title.includes("Payment Reference")) {
    return {
      ...check,
      title: "Uthibitisho wa malipo",
      description:
        "Rekodi inasema kuwa malipo yalithibitishwa. Hii haimaanishi ZiwaChain ilithibitisha malipo hayo moja kwa moja na M-Pesa.",
    };
  }
  if (check.title.includes("Mass Balance") || check.title.includes("Conservation of Mass")) {
    return {
      ...check,
      title: "Vipimo vilivyorekodiwa vinaendana sawa.",
      description:
        "Kiasi kilichorekodiwa katika kila hatua hakizidi kiwango kinachoruhusiwa na kanuni za mfumo.",
    };
  }
  if (check.title.includes("Work Credits")) {
    return {
      ...check,
      title: "Kumbukumbu ya mikopo ya kazi",
      description: "Rekodi ya mikopo ya kazi inaendana kikamilifu na matumizi ya malighafi yaliyorekodiwa.",
    };
  }
  if (check.title.includes("Pseudonym")) {
    return {
      ...check,
      title: "Utambulisho wa mkusanyiko unaendana",
      description: "Cheti kinaelekeza kwenye utambulisho ule ule wa faragha kama rekodi iliyohifadhiwa.",
    };
  }
  if (check.title.includes("Hash") || check.title.includes("Cryptographic")) {
    return {
      ...check,
      title: "Taarifa za cheti zinaendana",
      description: "Alama ya kidijitali ya cheti hiki inaendana na rekodi iliyohifadhiwa.",
    };
  }
  if (check.title.includes("Event Provenance")) {
    return {
      ...check,
      title: "Taarifa za mkusanyiko zilizohifadhiwa zinaendana",
      description: "Rekodi iliyohifadhiwa inaonyesha maelezo yale yale ya mkusanyiko.",
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
    let tTitle = title;
    let tDetails = details;
    if (title.includes("HARVEST") || title.includes("Harvest")) {
      tTitle = "The collection was recorded.";
      tDetails = "The amount collected was written into the record.";
    } else if (title.includes("VERIFIED") || title.includes("Verified")) {
      if (details.toLowerCase().includes("rejected")) {
        tTitle = "This collection was not approved.";
        tDetails = "The record says this collection was not approved.";
      } else {
        tTitle = "The collection was checked and approved.";
        tDetails = "The record says this collection was checked and approved.";
      }
    } else if (title.includes("ACCEPTED") || title.includes("Accepted")) {
      tTitle = "A receiving party recorded how much it accepted.";
      tDetails = "The receiving party recorded the amount it accepted.";
    } else if (title.includes("PROCESSED") || title.includes("Processed")) {
      tTitle = "The processing step was recorded.";
      tDetails = "The record includes a processing step.";
    } else if (title.includes("END_USE") || title.includes("End Use")) {
      tTitle = "The record says that some material was put to use.";
      tDetails = "The record includes material put to use.";
    } else if (title.includes("SETTLEMENT") || title.includes("Settlement")) {
      tTitle = "A payment confirmation was recorded.";
      tDetails =
        "The record says that payment was confirmed. This does not mean ZiwaChain independently checked the payment with M-Pesa.";
    } else if (title.includes("CORRECTED") || title.includes("Corrected")) {
      tTitle = "An earlier record was corrected on-chain.";
      tDetails = details || "An earlier evidence hash was superseded by a corrected record.";
    }
    return { title: tTitle, details: tDetails };
  }

  // Kiswahili
  let swTitle = title;
  let swDetails = details;

  if (title.includes("HARVEST") || title.includes("Harvest")) {
    swTitle = "Mkusanyiko ulirekodiwa.";
    swDetails = "Kiasi kilichokusanywa kiliandikwa kwenye rekodi.";
  } else if (title.includes("VERIFIED") || title.includes("Verified")) {
    if (details.toLowerCase().includes("rejected")) {
      swTitle = "Mkusanyiko huu haukuidhinishwa.";
      swDetails = "Rekodi inasema mkusanyiko huu haukuidhinishwa.";
    } else {
      swTitle = "Mkusanyiko ulikaguliwa na kuidhinishwa.";
      swDetails = "Rekodi inasema mkusanyiko huu ulikaguliwa na kuidhinishwa.";
    }
  } else if (title.includes("ACCEPTED") || title.includes("Accepted")) {
    swTitle = "Mhusika aliyepokea alirekodi kiasi alichopokea.";
    swDetails = "Mhusika aliyepokea alirekodi kiasi kilichokubaliwa.";
  } else if (title.includes("PROCESSED") || title.includes("Processed")) {
    swTitle = "Hatua ya uchakataji ilirekodiwa.";
    swDetails = "Rekodi inajumuisha hatua ya uchakataji.";
  } else if (title.includes("END_USE") || title.includes("End Use")) {
    swTitle = "Rekodi inasema kuwa sehemu ya malighafi ilitumika.";
    swDetails = "Rekodi inajumuisha malighafi iliyotumika.";
  } else if (title.includes("SETTLEMENT") || title.includes("Settlement")) {
    swTitle = "Uthibitisho wa malipo ulirekodiwa.";
    swDetails =
      "Rekodi inasema kwamba malipo yalithibitishwa. Hii haimaanishi ZiwaChain ilithibitisha malipo hayo moja kwa moja na M-Pesa.";
  } else if (title.includes("CORRECTED") || title.includes("Corrected")) {
    swTitle = "Rekodi ya awali ilisahihishwa kwenye mnyororo.";
    swDetails = "Ushahidi wa awali ulibadilishwa na rekodi iliyosahihishwa.";
  }

  return { title: swTitle, details: swDetails };
}

/**
 * Translate dynamic mass balance status string.
 */
export function getTranslatedMassStatus(status: string, lang: Language): string {
  if (!status) return "";
  if (lang === "en") return status;

  if (status.includes("Violated") || status.includes("violated")) {
    return "Tahadhari: Uwiano wa uzito umekiukwa — uzito wa hatua za baadaye umezidi kiasi kilichokusanywa.";
  }
  if (status.includes("Satisfied") || status.includes("holds")) {
    return "Uwiano wa uzito umeridhishwa (Mass Balance Holds): Kiasi kilichosindikwa kinalingana na pembejeo halisi.";
  }
  return status;
}

/**
 * Translate stage name badge.
 */
export function getTranslatedStageName(stage: string, lang: Language): string {
  if (lang === "en") return stage;
  const lower = stage.toLowerCase();
  if (lower.includes("rejected")) return "Imekataliwa";
  if (lower.includes("harvest")) return "Imevunwa";
  if (lower.includes("verif")) return "Imekaguliwa";
  if (lower.includes("accept")) return "Imepokelewa";
  if (lower.includes("settle")) return "Malipo Yamethibitishwa";
  if (lower.includes("process")) return "Imechakatwa";
  if (lower.includes("end")) return "Imetumika";
  if (lower.includes("record")) return "Imerekodiwa";
  if (lower.includes("checking")) return "Inakaguliwa...";
  return stage;
}
