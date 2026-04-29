export interface FflStep {
  step: string;
  title: string;
  body: string;
}

export interface FflFaq {
  q: string;
  a: string;
}

export interface FflTransferPath {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  steps: FflStep[];
}

export interface FflResourceLink {
  label: string;
  href: string;
}

export interface FflContactInfo {
  businessName: string;
  licenseNumber: string;
  addressLines: string[];
  phone: string;
  phoneHref: string;
  email: string;
  emailHref: string;
  hours: string;
}

export interface FflInfoPageContent {
  hero: {
    eyebrow: string;
    title: string;
    accent: string;
    description: string;
  };
  transferPaths: FflTransferPath[];
  ourFfl: {
    eyebrow: string;
    title: string;
    description: string;
    contact: FflContactInfo;
    receivingInstructions: string[];
    buyerChecklist: string[];
    sellerChecklist: string[];
  };
  faq: {
    eyebrow: string;
    title: string;
    items: FflFaq[];
  };
  resources: {
    dealerLocator: {
      eyebrow: string;
      title: string;
      description: string;
      note: string;
      link: FflResourceLink;
    };
    contact: {
      eyebrow: string;
      title: string;
      description: string;
    };
  };
  cta: {
    description: string;
    href: string;
    label: string;
  };
}

export const fflInfoPageContent: FflInfoPageContent = {
  hero: {
    eyebrow: "Federal Firearms License",
    title: "FFL TRANSFERS",
    accent: "BOTH DIRECTIONS.",
    description:
      "Whether you are buying from us and shipping to your local dealer or sending a transfer into Jackson Firearm Co., this page covers the process, the paperwork, and the best way to keep everything moving.",
  },
  transferPaths: [
    {
      id: "outbound",
      eyebrow: "Buying From Jackson Firearm Co.",
      title: "WE SHIP TO YOUR FFL",
      description:
        "For firearms purchased through our site, we coordinate the shipment to the receiving dealer you choose during checkout.",
      steps: [
        {
          step: "01",
          title: "PURCHASE ONLINE",
          body: "Choose your firearm, place the order, and provide the name and contact information for your preferred receiving FFL during checkout.",
        },
        {
          step: "02",
          title: "WE VERIFY & SHIP",
          body: "We confirm the dealer can accept the transfer, collect any required license documentation, and ship your order by insured carrier.",
        },
        {
          step: "03",
          title: "COMPLETE PICKUP",
          body: "Bring a valid government-issued ID to your dealer, complete ATF Form 4473, pass the background check, and take possession once approved.",
        },
      ],
    },
    {
      id: "inbound",
      eyebrow: "Sending A Firearm To Us",
      title: "TRANSFER INTO JACKSON FIREARM CO.",
      description:
        "If another dealer or eligible seller is sending a firearm to our store for you to pick up, we can receive and process that transfer here.",
      steps: [
        {
          step: "01",
          title: "CONTACT US BEFORE SHIPPING",
          body: "Have the sender contact us before the firearm goes out so we can confirm the transfer, provide our receiving details, and avoid delays on arrival.",
        },
        {
          step: "02",
          title: "INCLUDE BUYER DETAILS",
          body: "The shipment should clearly include your full name, phone number, and any order or reference information so we can match the package to the correct customer.",
        },
        {
          step: "03",
          title: "PICK UP IN STORE",
          body: "Once the firearm is logged in and ready, we will contact you to complete Form 4473, run the NICS background check, and finalize the transfer at our shop.",
        },
      ],
    },
  ],
  ourFfl: {
    eyebrow: "Our FFL",
    title: "RECEIVING TRANSFERS AT JACKSON FIREARM CO.",
    description:
      "Use the information below when another dealer needs to coordinate a transfer into our shop. A signed copy of our FFL and any additional intake details are available when the shipment is arranged with us.",
    contact: {
      businessName: "Jackson Firearm Co.",
      licenseNumber: "3-41-063-01-8G-07302",
      addressLines: ["600 2nd Street", "Jackson MN 56143"],
      phone: "(507) 675-4337",
      phoneHref: "tel:+15076754337",
      email: "info@jacksonfirearmco.com",
      emailHref: "mailto:info@jacksonfirearmco.com",
      hours: "Mon-Fri 9am-6pm · Sat 10am-4pm",
    },
    receivingInstructions: [
      "Contact our team before shipping any inbound transfer so we can confirm acceptance and provide the correct receiving documentation.",
      "Ask the sender to include your full legal name and a reliable phone number inside the box or on the packing slip.",
      "Once the transfer arrives and is checked in, we will reach out with pickup timing and any next steps.",
    ],
    buyerChecklist: [
      "Bring a valid, government-issued photo ID with your current address.",
      "Be ready to complete ATF Form 4473 in store.",
      "State waiting periods or other local requirements may still apply before release.",
    ],
    sellerChecklist: [
      "Coordinate with our staff before shipping.",
      "Include sender contact information and a copy of any required license or identification documents.",
      "Do not ship ammunition in the same package as the transferred firearm unless separately permitted and arranged.",
    ],
  },
  faq: {
    eyebrow: "Compliance FAQ",
    title: "FREQUENTLY ASKED QUESTIONS",
    items: [
      {
        q: "What is an FFL transfer?",
        a: "An FFL transfer is the legally required process for moving a firearm through a Federal Firearms Licensee so the receiving dealer can complete Form 4473, run the background check, and transfer the firearm to the buyer.",
      },
      {
        q: "Can I have a firearm transferred into Jackson Firearm Co.?",
        a: "Yes. We can receive inbound transfers, but we ask that the sender coordinate with us before shipping so we can confirm acceptance and provide the right receiving information.",
      },
      {
        q: "What information should be included with an inbound transfer?",
        a: "The package should identify the buyer clearly, including full name and contact information, along with any order or reference number that helps us match the shipment when it arrives.",
      },
      {
        q: "What do I need to bring when I pick up a transferred firearm?",
        a: "Bring a valid government-issued photo ID. We will walk you through ATF Form 4473 and the required NICS background check before the firearm can be released.",
      },
      {
        q: "Do parts and accessories require FFL transfer?",
        a: "Usually no. Most parts and accessories ship directly to you. Serialized receivers and complete firearms are the common items that still require FFL handling.",
      },
      {
        q: "Do you ship to any receiving FFL?",
        a: "We can ship to any receiving FFL that is willing and legally able to accept the transfer for you, subject to federal, state, and local restrictions.",
      },
      {
        q: "How long does the transfer process take?",
        a: "Shipping timelines depend on inventory and the receiving dealer, but the in-store pickup portion is usually completed once the firearm is logged, Form 4473 is finished, and the background check is approved.",
      },
    ],
  },
  resources: {
    dealerLocator: {
      eyebrow: "Find a Transfer FFL",
      title: "LOCATE A DEALER NEAR YOU",
      description:
        "If you are buying a firearm from us, you can use the ATF Federal Firearms Licensee quick query tool to identify a dealer near you that may accept transfers.",
      note: "Receiving-dealer transfer fees are set by that dealer and are not controlled by Jackson Firearm Co.",
      link: {
        label: "ATF FFL eZ Check",
        href: "https://fflezcheck.atf.gov/",
      },
    },
    contact: {
      eyebrow: "Need Help?",
      title: "CONTACT US",
      description:
        "Questions about outbound orders, inbound transfers, or what a sender needs from us? Reach out before the firearm ships and we will help you line it up.",
    },
  },
  cta: {
    description: "Ready to browse firearms that can ship to your preferred dealer?",
    href: "/firearms",
    label: "SHOP FIREARMS",
  },
};
