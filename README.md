<h1>New Normal</h1>
<center><img alt="new normal" src="https://github.com/joust/new-normal/raw/master/styles/images/new-normal.jpg"></center>
<p>
This browser app is a playground build around a huge collection of arguments used during Corona related discussions. The imaginary two sides are (technically) referred to as <b>Idiots</b> and <b>Sheep</b>. The three usages currently implemented are:
<ul>
  <li>An <b>UNO card game</b>, played strategically with arguments, ad hominem labelling and other game cards to simulate an actual discussion between up to 10 persons.</li>
  <li>A <b>Buzzword BINGO game</b>, played with arguments used in a discussion. Use it to have more fun in either your own discussions on the topic or that of others.</li>
  <li>A <b>Corona TEST</b>, which allows you to find out which "side" you are on. Choose your "cycles" and after that number of Tinder like swipe left/right decisions on arguments presented you know if you're an <b>Idiot</b> or a <b>Sheep</b>.</li>
</ul>
<p>
Aside from making sound fun of an imaginary either/or division that many people think is real these days, this little app has big things in store: It wants to build bridges, create awareness and knowledge. It is for people who really want to deal with the arguments of the other side of the discourse. It wants to make sure that people approach each other again. It wants to be a valuable source and enable an open and well-founded exchange about this ubiquitous topic.
</p><p>
Technically it's a plain HTML/CSS/ES6 PWA. The app is inter&shy;nationa&shy;lized and localized and contains a common core of universal, language inde&shy;pen&shy;dent argu&shy;ments and sets of argu&shy;ments only used and under&shy;stood locally.
</p>
<h1>Content</h1>
<h2>Menus and Arguments</h2>
<p>
All internationalized application content is stored in HTML format in language-directories in the <code>content</code> directory:
</p>
<ul>
<li><code>&lt;language code&gt;/intro.html</code>: the application intro</li>
<li><code>&lt;language code&gt;/start.html</code>: main application menu</li>
<li><code>&lt;language code&gt;/uno.html</code>: instructions for the uno game</li>
<li><code>&lt;language code&gt;/bingo.html</code>: instructions for the bingo game</li>
<li><code>&lt;language code&gt;/test.html</code>: instructions for the test</li>
<li><code>&lt;language code&gt;/install.html</code>: PWA installation instructions</li>
<li><code>&lt;language code&gt;/support.html</code>: Support instructions</li>
<li><code>&lt;language code&gt;/labels.html</code>: labels used by idiots and sheep</li>
<li><code>&lt;language code&gt;/appeal-tos.html</code>: appeal tos used by idiots and sheep</li>
<li><code>&lt;language code&gt;/fallacies.html</code>: fallacies used by idiots and sheep</li>
<li><code>&lt;language code&gt;/topics.html</code>: the local topics</li>
<li><code>&lt;language code&gt;/result.html</code>: the test result template</li>
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
<li><code>&lt;language code&gt;/&lt;territory code&gt;/sheep.html</code>: Territory local <b>Sheep</b> argu&shy;ments</li>
<li><code>&lt;language code&gt;/&lt;territory code&gt;/idiot.html</code>: Territory local <b>Idiot</b> argu&shy;ments</li>
</ul>
<p>The arguments of the Common core have a unique id across all languagues:</p>
<ul>
<li><code>I&lt;n&gt;</code> for the <b>Idiot</b> arguments</li>
<li><code>S&lt;n&gt;</code> for the <b>Sheep</b> arguments</li>
</ul>
<p>The territory local arguments have a unique id with the territory code in it:</p>
<ul>
<li><code>I&lt;territory code&gt;&lt;n&gt;</code> for the <b>Idiot</b> arguments</li>
<li><code>S&lt;territory code&gt;&lt;n&gt;</code> for the <b>Sheep</b> arguments</li>
</ul>

<p>All pejorative / judgmental wording in the arguments should be set in italics so it can be removed according to the users attitude (see chapter Attitude). Example:</p>
<code>
  &lt;p&gt;They say&lt;i&gt; in all seriousness&lt;/i&gt; that ...&lt;/p&gt;
</code>

<h2>Topics</h2>
<p>
Arguments and topics are linked to each other. This can also be supplemented by local arguments and topics. The base links can be found in the top-level file <code>topics.html</code>, additions are in the respective <code>topics.html</code> within the localized folders. The entries each represent a topic in the following format</p>
<li><code>&lt;section id="T&lt;n&gt;" title=""</code></li>

<h2>Sources</h2>
<p>
The Sources for all Arguments are stored language-mixed in the top-level file <code>sources.html</code>. 
</p>
<p>A source is represented by an anchor with language, reference to the argument, the link url and the link text as text:</p>
<ul>
<li><code>&lt;a lang="en" class="I99" href="https://...."&gt;link text&lt;/a&gt;</code></li>
</ul>

<h1>Technical</h1>

<h2>Modern Browsers</h2>

<p>The app will only work on modern browsers as it relies on things like css animations, fetch and native es6 features like async/await, arrow functions, template strings and deconstruction. When Service Workers are available, it will also offline its content.</p>

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

<h1>Exclusion of Topics</h1>
<p>
The app allows to exclude topics from being used in the generation of game cards. This helps to deprecate old topics/arguments that are not common in discussions any more - or simply to exclude topics that you do not expect getting used.</p>
<p>
In front of every topic title in the list you find a checkbox to toggle it's exclusion. If its checked, it will be used during the next card generation, otherwise not. Your choice will be stored in the local storage of your browser.
</p>

<h1>Permalinks</h1>
<p>The app allows to deep link directy to arguments or topics, e.g. to transmit them to others. This can be achieved just by specifying either the topic id or the argument ids in the url's hash. Some examples:</p>
<ul>
<li><code>https://new-normal.app#I17</code>: Show <b>idiot</b> argument with id <code>I17</code></li>
<li><code>https://new-normal.app#S69</code>: Show <b>sheep</b> argument with id <code>S69</code></li>
<li><code>https://new-normal.app#I17&amp;S69</code>: Show both arguments with id <code>I17</code> and <code>S69</code></li>
<li><code>https://new-normal.app#I</code>: Show all <b>idiot</b> arguments</li>
<li><code>https://new-normal.app#S</code>: Show all <b>sheep</b> arguments</li>
<li><code>https://new-normal.app#S&amp;I</code>: Show all arguments of both sides, first the <b>sheep</b></li>
<li><code>https://new-normal.app#I&amp;S</code>: Show all arguments of both sides, first the <b>idiots</b></li>
<li><code>https://new-normal.app#T17</code>: Show both the <b>idiot</b> and the <b>sheep</b> argument belonging to corona test topic <code>T17</code></li>
</ul>

<h1>Roadmap</h1>
<p>
The following is in development or planned:
</p>
<ul>
<li>Add more <a href="https://github.com/joust/new-normal/blob/master/sources.html">sources</a> to all arguments for anyone to check</li>
<li>Extend the number of available localizations by translating the common core and gather the local arguments used</li>
</ul>
<h1>Support</h1>
<p>
The contents of this app - like our reality - are in con&shy;stant flux. New argu&shy;ments and topics are added regu&shy;larly and others become irrele&shy;vant. In addition, there are argu&shy;ments that are used worldwide (the common core) and argu&shy;ments only used and under&shy;stood locally. For keeping this up to date, your support is very welcome!
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
Flip Effect: <a target="_blank" href="https://lab.hakim.se/flipside">Flipside</a>
</p><p>
Pyro Effect: <a target="_blank" href="https://jsfiddle.net/elin/7m3bL">Eddie Lin</a>
</p><p>
Jumping Virus Effect: Kuba Koischwitz 🐿️
</p><p>
<img width="100" alt="berlin" style="float:left" src="https://github.com/joust/new-normal/raw/master/styles/images/berlin.png">PROUDLY MADE IN BERLIN CHARLOTTENBURG.
</p>

<h1>License</h1>
<p>
<a target="_blank" rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" /></a><br />This Applications  content and code is licensed under a <a  target="_blank" rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike 4.0 International License</a>.
</p>
