<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Luca's Website</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>

  <header>
    <h1>Luca’s Website</h1>
  </header>

  <nav>
    <button class="tab-button active" data-tab="tab1">About Me</button>
    <button class="tab-button" data-tab="tab2">Cats</button>
    <!-- <button class="tab-button" data-tab="tab3">Tab 3</button>
    <button class="tab-button" data-tab="tab4">Tab 4</button>
    <button class="tab-button" data-tab="tab5">Tab 5</button>
    <button class="tab-button" data-tab="tab6">Tab 6</button> -->
  </nav>

  <main>
    <section id="tab1" class="active">
      <div class="card">
        <h2>About Me</h2>
        <p>Hello, I am Luca, and this is my website.</p>
      </div>
      <div class="card">
        <h2>Find Me Online</h2>
        <div class="contact">
          <p><strong>Roblox:</strong> codyferd</p>
          <p><strong>GitHub:</strong> codyferd</p>
          <p><strong>TikTok:</strong> @polycat.codyferd</p>
          <p><strong>YouTube:</strong> polycat.codyferd</p>
          <p><strong>Mastodon:</strong> codyferd@mastodon.social</p>
          <p><strong>Snapchat:</strong> polycatcodyferd</p>
          <p><strong>Discord:</strong> codyferd_81690</p>
          <p><strong>PeerTube:</strong> polycat@video.sadmin.io</p>
        </div>
      </div>
    </section>

    <section id="tab2">
      <div class="card"><h2>Cats</h2>
        <p>Cats are the best animals...</p>
      </div>
    </section>

    <section id="tab3">
      <div class="card"><h2>Tab 3</h2><p>This is example content for tab 3.</p></div>
    </section>

    <section id="tab4">
      <div class="card"><h2>Tab 4</h2><p>This is example content for tab 4.</p></div>
    </section>

    <section id="tab5">
      <div class="card"><h2>Tab 5</h2><p>This is example content for tab 5.</p></div>
    </section>

    <section id="tab6">
      <div class="card"><h2>Tab 6</h2><p>This is example content for tab 6.</p></div>
    </section>
  </main>

  <footer>
    Made in 2025 by Luca F
  </footer>

  <script src="script.js"></script>
</body>
</html>
