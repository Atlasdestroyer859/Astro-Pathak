export const SERVICES = [
  {
    name: 'Kundli Analysis',
    price: null,
    description: 'Detailed birth chart analysis covering all 12 houses, planetary positions, dashas & future predictions.',
    icon: 'chart',
    hasFee: false,
  },
  {
    name: 'Marriage Compatibility',
    price: null,
    description: 'Kundli Milan (Guna matching) with detailed compatibility analysis for a blissful married life.',
    icon: 'rings',
    hasFee: false,
  },
  {
    name: 'Career & Finance',
    price: null,
    description: 'Planetary influence on career, best profession, financial gains, and auspicious muhurat for new ventures.',
    icon: 'briefcase',
    hasFee: false,
  },
  {
    name: 'Vastu Shastra',
    price: null,
    description: 'Home & office Vastu consultation for positive energy, prosperity, and peace of mind.',
    icon: 'home',
    hasFee: false,
  },
  {
    name: 'Numerology',
    price: null,
    description: 'Life path number, destiny analysis, name correction, and lucky number guidance.',
    icon: 'hash',
    hasFee: false,
  },
  {
    name: 'Prashna Kundli',
    price: null,
    description: 'Instant horary chart reading to answer specific questions about any area of life.',
    icon: 'question',
    hasFee: false,
  },
  {
    name: 'Child Birth Timing',
    price: null,
    description: 'Auspicious time prediction for childbirth and analysis of a child\'s future from parental charts.',
    icon: 'moon',
    hasFee: false,
  },
  {
    name: 'Health & Wellbeing',
    price: null,
    description: 'Medical astrology — identify health vulnerabilities, remedies, and favorable periods for recovery.',
    icon: 'leaf',
    hasFee: false,
  },
];

export const TIME_SLOTS = [
  '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
];

export const CONSULTATION_MODES = [
  {
    value: 'phone',
    label: 'Phone Call',
    desc: 'We call you on your WhatsApp number',
    icon: 'phone',
  },
  {
    value: 'video',
    label: 'Video Call',
    desc: 'Google Meet link sent before session',
    icon: 'video',
  },
  {
    value: 'in-person',
    label: 'Meet in Person',
    desc: 'Visit our office in Greater Noida West',
    icon: 'map-pin',
  },
] as const;

export const OFFICE = {
  label: 'Greater Noida West Office',
  address: '1503, Tower I, Rajhans Residency\nBishrakh Jalalpur, Sector 1\nGreater Noida West – 201308\nUttar Pradesh, India',
  phone: '9643437281',
  mapUrl: 'https://maps.google.com/?q=Rajhans+Residency+Bishrakh+Greater+Noida+West',
};
