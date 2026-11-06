import Link from 'next/link';

export const metadata = { title: 'Privacy policy' };

// Text carried over from the original PrivacyPolicy.jsx, with the new sign-in
// and storage details added to sections 1 and 5.
export default function PrivacyPolicy() {
  return (
    <>
      <header className="top">
        <div className="top-in">
          <Link className="brand" href="/" aria-label="Exedia home">
            <span className="brand-mark"><span /></span>
            <b>Exedia</b>
          </Link>
        </div>
      </header>
      <main>
        <article className="prose">
          <h1>Privacy Policy</h1>
          <p className="mono muted">Last updated: 6 November 2026</p>

          <p>This Privacy Policy describes how Exedia Platform (&quot;Exedia,&quot; &quot;we,&quot; or &quot;us&quot;) collects, uses, and shares information about you when you use our website, mobile application, and other online services (collectively, the &quot;Services&quot;). By using or accessing the Services, you agree to this Privacy Policy.</p>

          <h2>1. Information we collect</h2>
          <ul>
            <li>Account information: when you sign in with Google we receive your name, profile picture and a Google account id. We store the name, picture and id so your work carries your name.</li>
            <li>Content you post: images, process shots, titles, notes, comments, trails, and what you declare about AI use and credit.</li>
            <li>Usage information: the features you use, the content you view or post, and other actions taken in connection with the Services.</li>
            <li>Device information: such as browser type and operating system.</li>
            <li>Cookies: we set one cookie that keeps you signed in. We do not use advertising trackers.</li>
          </ul>

          <h2>2. How we use your information</h2>
          <p>We use the information we collect to provide and improve the Services. Specifically we may use your information to provide customer service, send communications, analyze usage of the Services, personalize content, develop new products, and protect against fraud or other illegal activities.</p>

          <h2>3. How we share your information</h2>
          <p>We do not share your personal information with third parties without your consent except as necessary to provide our services or as required by law or legal process. Images and posts are stored with our content provider, Sanity. We may share aggregated or de-identified data that does not identify any individual user.</p>

          <h2>4. Your rights and choices</h2>
          <p>You have the right to access a copy of your personal data, to have it corrected if it is inaccurate, and to have it deleted if we no longer need it (subject to certain exceptions). You can delete pieces you posted from their page at any time. To exercise these rights, contact us at Ace.rav3n@gmail.com.</p>

          <h2>5. Data security</h2>
          <p>We take reasonable measures to protect personal data from loss, misuse, unauthorized access, disclosure, alteration and destruction. Sign-in is verified on our server and all changes to your data go through it. No security measure is perfect, so we cannot guarantee that personal data will never be disclosed in ways not described in this Privacy Policy.</p>

          <h2>6. Changes to our Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. If we make material changes we will post a notice on this page before they take effect, or email you if the law requires it.</p>

          <h2>7. Contact us</h2>
          <p>If you have any questions about this Privacy Policy please contact us at Ace.rav3n@gmail.com.</p>

          <p className="muted" style={{ marginTop: 40 }}>Exedia Platform Inc.</p>
        </article>
      </main>
    </>
  );
}
