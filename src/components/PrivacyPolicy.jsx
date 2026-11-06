import React from 'react'
import NavBar from './NavBar';
import logo from '../assets/AJC_logo.png'
import { Link } from 'react-router-dom'

const PrivacyPolicy = () => {



  return (
    <>
      <header>
        <div className='flex-col w-full h-full object-cover bg-gradient-to-l from-orange-300 to-rose-500 text-center'>
          <h1 className='font-mono animate-pulse pt-4 flex-col'> EXEDIA PLATFORMS LTD. <br></br> <br></br></h1>
          <div className='p-2 w-full flex flex-row justify-center items-center shadow-lg bg-gray-900' >

            <Link to="/login">
              <img src={logo} alt="Ajc.png"

                className="w-20 h-25 flex-row "
                referrerPolicy="no-referrer" />
            </Link>

          </div>
        </div>
      </header>

      <div className='flex flex-col font-mono' >
        <h1 className='font-bold text-[36px] justify-center item-center flex mt-10'>
          Privacy Policy
        </h1>
        <h3 className='justify-end item-center flex mr-3 mt-10'>
          Last Updated: 2/1/2023
        </h3>
      </div>

      <body className='flex flex-col justify-center items-center gap-10 bg-gray-200 p-10'>
        <p>
          This Privacy Policy describes how Exedia Platform ("Exedia," "we," or "us") collects, uses, and shares information about you when you use our website, mobile application, and other online services (collectively, the "Services"). By using or accessing the Services, you agree to this Privacy Policy.
        </p>
        <p className='' >
          1. Information We Collect

          We collect information about you in various ways when you use the Services. This includes:
          <br />
          <br />
          •	Personal Information: We collect personal information from you when you register for an account on Exedia Platform. This may include your name, email address, phone number, and other contact information.
          <br />
          •	Usage Information: We collect usage information about your interactions with the Services. This may include the features you use, the content you view or post, and other actions taken in connection with the Services.
          <br />
          •	Device Information: We collect device-specific information such as your hardware model, operating system version, unique device identifiers and mobile network information including phone number.
          <br />
          •	Location Information: We may collect precise location data from your device when you use certain features of our Services.
          <br />
          •	Information from Cookies and Other Tracking Technologies: We use cookies and other tracking technologies to collect information about your activity on our Services. This includes pages visited and links clicked on within our Services.

        </p>
        <p className='' >
          2. How We Use Your Information
          We use the information we collect to provide and improve our Services. Specifically we may use your information to:
          <br />
          •	Provide customer service,
          <br />
          •	Send communications,
          <br />
          •	Analyze usage of our Services,
          <br />
          •	Personalize content,
          <br />
          •	Develop new products, and
          <br />
          •	Protect against fraud or other illegal activities.
        </p>
        <p className='' >
          3. How We Share Your Information

          We do not share your personal information with third parties without your consent except as necessary to provide our services or as required by law or legal process. In addition we may share aggregated or de-identified data with third parties for research purposes or for marketing purposes without restriction but such data will not contain any personally identifiable information about any individual user of our services.
        </p>
        <p className='' >
          4. Your Rights & Choices

          You have certain rights in relation to your personal data including the right to access a copy of it and request that it be corrected if it is inaccurate or deleted if we no longer need it for the purposes set out above (subject to certain exceptions). You can exercise these rights by contacting us at Ace.rav3n@gmail.com. You also have choices about how we communicate with you including opting out of receiving promotional emails from us by following the unsubscribe instructions included in those emails or by contacting us at Ace.rav3n@gmail.com.
        </p>
        <p className='' >

          5. Data Security

          We take reasonable measures designed to protect personal data from loss, misuse, unauthorized access, disclosure, alteration and destruction however no security measure is perfect so please be aware that despite our efforts no security measures are absolute guarantees of safety against all potential security breaches nor can we guarantee that all personal data provided will never be disclosed in ways not otherwise described in this Privacy Policy due to errors in transmission or unauthorized acts of third parties such as hackers etc..
        </p>
        <p className='' >
          6. Changes To Our Privacy Policy

          We may update this Privacy Policy from time to time so please review it periodically for changes which are binding on you once posted on this page unless otherwise provided under applicable law.. If we make any material changes we will notify you either through a notice on this page prior to the change becoming effective or via email if required by applicable law..
        </p>

        <p className='' >
          7. Contact Us

          If you have any questions about this Privacy Policy please contact us at Ace.rav3n@gmail.com
        </p>

      </body>
      <footer className='flex justify-end mr-5 mb-5 mt-5'>
        Exedia Platform Inc.
      </footer>


    </>
  )
}


export default PrivacyPolicy;