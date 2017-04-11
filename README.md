# CSS inliner
## Usage
Include jQuery and ```css-inliner.js``` in your html template:
```html
<script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" crossorigin="anonymous" id="css-inliner-jquery"></script>
<script src="css-inliner.min.js" id="css-inliner-core"></script>
```
reload page and you are done.

- All elements that have **ID starting with "css-inliner-"** will be deleted.
- Code inside ```<style>``` with **id="responsive"** is kept for email clients that support it, and should be used for responsive styles.

## Options
There are some options avaliable for you:
- **moz-do-not-send**: This option adds parametter ```moz-do-not-send="true"``` to images, so Thunderbird is not dowloading and attaching images to the email body.
- **rgb-to-hex**: This option exists only because browsers are parsing inline colors to rgb. Let Inliner parse all ```rgb()``` formated colors back to thier ```#hex``` values.   
- **printout**: This simply prints the final HTML code before ```<body>``` end inside ```<pre>``` tags, so it's easy to copy.
Easy peasy.

## Example
There is [test.html](test.html) file with simple example. Just clone this repository and open test.html in your browser.