# template-ui-nav

## Local development

[Full documentation](https://single-spa.js.org/docs/recommended-setup#local-development)

Tutorial video: [youtube](https://www.youtube.com/watch?v=vjjcuIxqIzY&list=PLLUD8RtHvsAOhtHnyGx57EYXoaNsxGrTU&index=4) / [bilibili](https://www.bilibili.com/video/av83617789/)

It is preferred to do local development one module at a time.

```sh
cd template-ui-nav
npm install
npm start
```

Go to http://localhost:9001 and follow the instruction.

Now, go to https://d1234567890.cloudfront.net. In the browser console, run the following:

```js
localStorage.setItem("devtools", true);
```

Refresh the page. Click on the tan / beige rectangle:

![image](https://user-images.githubusercontent.com/5524384/75211359-e46b9280-5740-11ea-80bb-974846df414b.png)

Set an [import map override](https://github.com/joeldenning/import-map-overrides/) to `9001`.

![image](https://user-images.githubusercontent.com/5524384/75211553-7e333f80-5741-11ea-97d6-d3d86ffd1826.png)

Refresh the page. Your local code for this module will now be running on https://d1234567890.cloudfront.net. You may make changes locally and refresh the page to see them.
