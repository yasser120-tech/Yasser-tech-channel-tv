const video = document.getElementById("video");
const channelsDiv = document.getElementById("channels");
const categoriesDiv = document.getElementById("categories");

const IPTV_URL = "iptv.m3u";
let allChannels = [];
let currentCategory = "All";

function playStream(url) {
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
  } else {
    video.src = url;
    video.play();
  }
}

function renderCategories() {
  const cats = ["All", ...new Set(allChannels.map(c => c.group))];

  categoriesDiv.innerHTML = "";
  cats.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "category-btn" + (cat === "All" ? " active" : "");
    btn.textContent = cat;
    btn.onclick = () => {
      document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = cat;
      renderChannels();
    };
    categoriesDiv.appendChild(btn);
  });
}

function renderChannels() {
  channelsDiv.innerHTML = "";
  allChannels
    .filter(ch => currentCategory === "All" || ch.group === currentCategory)
    .forEach(ch => {
      const card = document.createElement("div");
      card.className = "channel-card";
      card.innerHTML = `
        <img src="${ch.logo}" onerror="this.src='https://via.placeholder.com/150?text=TV'">
        <span>${ch.name}</span>
      `;
      card.onclick = () => {
        playStream(ch.url);
        window.scrollTo({ top: 0, behavior: "smooth" });
      };
      channelsDiv.appendChild(card);
    });
}

// LOAD IPTV
fetch(IPTV_URL)
  .then(res => res.text())
  .then(data => {
    const lines = data.split("\n");
    let channel = {};

    lines.forEach(line => {
      line = line.trim();

      if (line.startsWith("#EXTINF")) {
        channel = {};
        channel.name = line.split(",")[1] || "Unknown";
        const logo = line.match(/tvg-logo="(.*?)"/);
        const group = line.match(/group-title="(.*?)"/);
        channel.logo = logo ? logo[1] : "";
        channel.group = group ? group[1] : "Other";
      }

      if (line.startsWith("http")) {
        channel.url = line;
        allChannels.push(channel);
      }
    });

    renderCategories();
    renderChannels();
    if (allChannels.length > 0) playStream(allChannels[0].url);
  });
