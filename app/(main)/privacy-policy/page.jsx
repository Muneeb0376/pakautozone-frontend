import PrivacyPolicyClient from './PrivacyPolicyClient';

export const metadata = {
  title: 'Privacy Policy — Pak Auto Zone',
  description:
    'Pak Auto Zone par aap ki maloomat kaise jama ki jati hai, kis liye istemal hoti hai, kitni der rakhi jati hai aur aap ke kya huqooq hain.',
  alternates: { canonical: '/privacy-policy' },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}
