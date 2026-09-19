# DOMPurify vendor provenance

Updated to DOMPurify 3.4.15 from the official npm package:
https://registry.npmjs.org/dompurify/-/dompurify-3.4.15.tgz

The package SHA-512 integrity was verified before copying `package/dist/purify.min.js`:

`sha512-EUBjM+B+lkDE41iE82DDSCfkoPGfXx8IxFxPMjNzm/Uk4xDet77rTN9wqlxlVg71kK7XGuUMv6wUxJUwwv+Xyw==`

The distribution's license header is retained. Source and licenses:
https://github.com/cure53/DOMPurify/tree/3.4.15

Case Notes verification: hostile HTML paste removes script/event handlers and unsafe links; screenshot paste and copy/reload retain the image. Future upgrades should repeat these checks in addition to the Node suite.
