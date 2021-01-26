<h1>New Normal</h1>
<center><img src="https://github.com/joust/new-normal/raw/master/images/new-normal.jpg"></center>
<p>
This is a plain HTML/CSS/ES6 implementation of a Buzzword BINGO PWA. Instead of Buzz&shy;words it is played with arguments used during a (Corona related) discussion. The two sides of the discussion are (technically) referenced as <b>Idiots</b> and <b>Sheeple</b>.
</p><p>
The app is inter&shy;nationa&shy;lized and contains a common core of universal, language inde&shy;pen&shy;dent argu&shy;ments and sets of argu&shy;ments only used and under&shy;stood locally.
</p>
<h1>Content</h1>
<p>
All internationalized application content is stored in HTML format in language-directories:
</p>
<ul>
<li><code>&lt;language code&gt;/intro.html</code>: the application intro</li>
<li><code>&lt;language code&gt;/start.html</code>: main application menu</li>
<li><code>&lt;language code&gt;/gameplay.html</code>: gameplay instructions</li>
<li><code>&lt;language code&gt;/install.html</code>: PWA installation instructions</li>
<li><code>&lt;language code&gt;/support.html</code>: Support instructions</li>
<li><code>&lt;language code&gt;/credits.html</code>: the credits</li>
<li><code>&lt;language code&gt;/attitude.html</code>: the attitude (see next chapter)</li>
<li><code>&lt;language code&gt;/legal.html</code>: the legal notice</li>
</ul>
<p>
All internationalized argu&shy;ments are stored in HTML format in language- and terri&shy;tory-direc&shy;tories:
</p>
<ul>
<li><code>&lt;language code&gt;/sheep.html</code>: Common core <b>Idiot</b> argu&shy;ments and labels</li>
<li><code>&lt;language code&gt;/idiot.html</code>: Common core <b>Sheep</b> argu&shy;ments and labels</li>
<li><code>&lt;territory code&gt;/sheep-local.html</code>: Local <b>Sheep</b> argu&shy;ments</li>
<li><code>&lt;territory code&gt;/idiot-local.html</code>: Local <b>Idiot</b> argu&shy;ments</li>
</ul>
<p>The arguments of the Common core have a unique id across all languagues:</p>
<ul>
<li><code>I&lt;n&gt;</code> for the <b>Idiot</b> arguments</li>
<li><code>S&lt;n&gt;</code> for the <b>Sheep</b> arguments</li>
</ul>
<p>The local arguments have a unique id with the territory code in it:</p>
<ul>
<li><code>I&lt;territory code&gt;&lt;n&gt;</code> for the <b>Idiot</b> arguments</li>
<li><code>S&lt;territory code&gt;&lt;n&gt;</code> for the <b>Sheep</b> arguments</li>
</ul>

<p>All pejorative / judgmental wording in the arguments should be set in italics so it can be removed according to the users attitude (see chapter Attitude). Example:</p>
<code>
  &lt;p&gt;They say&lt;i&gt; in all seriousness&lt;/i&gt; that ...&lt;/p&gt;
</code>

<h1>Technical</h1>

<h2>Modern Browsers</h2>

<p>The app will only work on modern browsers as it relies on things like css animations, fetch and native es6 features like async/await, arrow functions, template strings and deconstruction. When Service Workers are available, it will also offline its content.</p>

<h2>FastClick</h2>

<p>FastClick is (still) included to supress click delays on mobile platforms. I am aware that it is long deprecated &amp; unsupported and that there are viewport settings and platform specific css <code>touch-action: manipulation</code> to fix most issues in modern OS versions.</p>

<h1>Attitude</h1>

<p>The App allows to configure your attitude. It will be stored in the local storage of your browser:</p>

<h2>hasty</h2>
<p>Skip the intro sequence.</p>

<h2>curious</h2>
<p>Auto-Flip to the details for selected arguments.</p>
 
<h2>open</h2>
<p>Show the sources to the arguments immediately.</p>

<h2>fair</h2>
<p>Do not randomly choose from pejorative labels for card titles.</p>

<h2>correct</h2>
<p>Follow the label with a gender identity rights conformant extension.</p>

<h2>friendly</h2>
<p>Remove all pejorative argument wording (the text blocks set in italics).</p>

<h1>Exclusion of Arguments</h1>
<p>
The app allows to exclude arguments from being used in the generation of game cards. This helps to deprecate old arguments that are not common in discussions any more - or simply to exclude arguments that you do not expect getting used.</p>
<p>
Behind every argument title you find the colored argument id. By clicking on it, you can toggle the exclusion of this argument. If its grey, an arguments will not be used during the next card generation. Your choice will be stored in the local storage of your browser.
</p>

<h1>Roadmap</h1>
<p>
The following features are in development or planned:
</p>
<ul>
<li>Add more <a href="https://github.com/joust/new-normal/blob/master/sources.html">sources</a> to all arguments for anyone to check</li>
<li>Visualize the counter arguments of an argument/claim cards</li>
<li>Extend the number of available localizations by translating the common core and gather the local arguments used</li>
</ul>
<h1>Support</h1>
<p>
The contents of this game - like our reality - are in con&shy;stant flux. New argu&shy;ments are added regu&shy;larly and others become irrele&shy;vant. In addition, there are argu&shy;ments that are used worldwide (the common core) and argu&shy;ments only used and under&shy;stood locally. For keeping this up to date, your support is very welcome!
</p>
<h2>How can I support?</h2>

<ul>
  <li>Hints on missing/suboptimally described argu&shy;ments</li>
  <li>Hints on sources to support/rebut argu&shy;ments:</li>
    <ol>
      <li>Scien&shy;tific, prefer&shy;ably peer-reviewed papers</li>
      <li>State&shy;ments by scien&shy;tists/doctors, e.g. in inter&shy;views</li>
      <li>Articles from mass media</li>
      <li>Articles from alternative media</li>
      <li>In exceptions: Videos from Youtube and other plat&shy;forms</li>
    </ol>
  <li>Contri&shy;buting local argu&shy;ments of a parti&shy;cular country</li>
  <li>Trans&shy;lating the Common Core of argum&shy;ents</li>
  <li>Praise and/or constructive criticism in general 😉</li>
</ul>

<h2>Which ways can I support?</h2>
<ol>
  <li>Make a pull request</li>
  <li>Send an email to kolja [at] new-normal.app</li>
</ol>

<h1>Credits</h1>

<p>I would like to thank all friends and family members who fearlessly got into discussions and ultimately provided the inspiration and content for this game. As well as
</p>
<ul>
<li>all scientists, who are fully committed to reason and the scientific approach,</li>
<li>all journalists, who see themselves as a real corrective and as the "fourth power",</li>
<li>all artists, who, despite the new normal, do not shy away from critical art and</li>
<li>all philosophers, who currently help us to make sense of whats happening through critical thinking.</li>
</ul>
<p>
And finally these nerds who invented this internet.</p>
<p>Font: <a target="_blank" href="https://www.hvdfonts.com/fonts/hvd-crocodile">HVD Crocodile</a>
</p><p>
Flip Effect: <a taget="_blank" href="https://lab.hakim.se/flipside">Flipside</a>
</p><p>
Pyro Effect: <a target="_blank" href="https://jsfiddle.net/elin/7m3bL">Eddie Lin</a>
</p><p>
Jumping Virus Effect: Kuba Koischwitz 🐿️
</p><p>
<img width="100" style="float:left" src="https://github.com/joust/new-normal/raw/master/images/berlin.png">PROUDLY MADE IN BERLIN CHARLOTTENGRAD.
</p>

<h1>License</h1>
<p>
<a target="_blank" rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" /></a><br />This Applications  content and code is licensed under a <a  target="_blank" rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike 4.0 International License</a>.
</p>