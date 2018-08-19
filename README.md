# Disposable Email Helper

Disposable Email Helper is a _Chrome_ extension that allows you to easily insert and manage disposable email addresses (favorite + random) on popular platforms using a context menu on text input fields.

This extension is best used when you don't want to provide a real email address just to download a document, get a one time code, etc. This  extension **should not be used when privacy or confidentiality are important considerations**. 

_Note_: Not compatible with _Firefox_ due to inconsistenies in the implementation of the `contextMenus` API across browsers.




## Features

  - When selecting a menu option:  

    1. The email address will be auto-filled for you  
    2. The webpage for the mailbox associated with the email address will be opened in the background, or if the webpage is already opened in a tab **in the same window**, then after auto-filling the tab with the already opened mailbox will be given focus so you can easily find it without opening a redundant tab  
  
  - You can define a favorite mailbox name that you can use as a defualt and does not randomize  

  - You can use a random email address as well:  
  
    1. A new random email address will be generated after the current random email address is auto-filled  
    2. The random email address history entries in the context menu allow you to reuse the last five random email addresses with the email service used at that time, even if you switch to a different disposable email address service.  
    3. You can clear the history of previous random email addresses by using the "Clear History" context menu option

This extension does not support advanced features of some disposable email services, such as forwarding from disposable email to your real email address or specifying a different receive and view email address through the disposable email service.

    
## Security and Privacy Considerations
   
Users should understand that simply using a disposable email address does not defend against snooping by ISPs and may not be completely anonymous without additional tools, such as VPNs, tor, etc. Not all disposable email services use TLS/HTTPS. 



## Using this extension directly from source

No external libraries are used for this extension and all code is vanilla JavaScript.

To load a local version, follow the docs [to load local extension](https://developer.chrome.com/extensions/faq#faq-dev-01)

As a regular user, you can install the [Chrome Webstore](https://chrome.google.com/webstore/) version.



## Running the tests

There are currently no tests included for this extension because there is no easy way to test launching and working with the context menu. 

If you have some suggestions for developing tests, these would be welcome - please [open an issue](https://github.com/erichgoldman/disposable-email-helper/issues/new) to discuss first.



## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

We are actively looking for contributors to create translations. You can generate a pull request with a new locale and translate `messages.json` from the "en" locale. You can learn more about the internationalization process for chrome extensions in the [`chrome.i18n documentation`](https://developer.chrome.com/extensions/i18n)

If you would like to add an additional service, you can add a new entry in `services.js`. Please note, the extension only supports extensions where the mailbox can be reached by a specific URL (e.g., a URL/`GET` parameter must be specified or must be part of the path). Currently, the extension will only work where the mailbox name parameter (a) does not include the domain name and (b) is the last part of the URL (e.g., simple concatenation). Please validate any service before issuing a pull request, use HTTPS URLs where possible. Services which requires CAPTCHA or other user interaction to setup the email inbox are not compatible.



## Help and Documentation

Please visit the [wiki on Github](https://github.com/erichgoldman/disposable-email-helper/wiki) for documentation.

If you encounter issues or have general questions about functionality, please open an [issue on Github](https://github.com/erichgoldman/disposable-email-helper/issues/new).



## Donate and Support

Please rate and leave feedback on the [Chrome Webstore](https://chrome.google.com/webstore/), star it on Github, share with your friends, blog about it, etc.

If you find this extension useful and it saved you some time, please help support development by donating $2.22 USD:

  - [Donate via PayPal Pool](https://www.paypal.com/pools/c/8799nHVefv)
  - Donate via Bitcoin (BTC): [38BgwZpgTGpBBSLLEhuBxy6CsjdKUsEaN3](https://www.blockchain.com/btc/address/38BgwZpgTGpBBSLLEhuBxy6CsjdKUsEaN3)
  - Donate via Ethereum (ETH): [0x802dC14dB6B43571026683846ca22212e82F25b7](https://ethplorer.io/address/0x802dc14db6b43571026683846ca22212e82f25b7) 

No money? Feel free to send a thank you note, drawing, love note, etc. You can also support the continued development of this extension by helping with [translations](#contributing) and [reporting any issues or problems](https://github.com/erichgoldman/disposable-email-helper/issues/).

## Versioning

We use [SemVer](http://semver.org/) for versioning. 



## License

This project is licensed under the GPLv3 License - see the [LICENSE.txt](LICENSE.txt) file for details.

