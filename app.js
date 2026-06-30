function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.getElementById('hero').style.display = id === 'about' ? '' : 'none';
  if (id === 'scores') loadScores('nfl', document.querySelector('.score-tab'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
}

// Show hero only on About (default landing)
document.addEventListener('DOMContentLoaded', () => {
  showPage('about');
});

// SCORES via ESPN API (no key needed)
const ESPN_URLS = {
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
};

async function loadScores(league, tabEl) {
  document.querySelectorAll('.score-tab').forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');

  const container = document.getElementById('scores-container');
  container.innerHTML = '<div class="scores-loading">Loading scores...</div>';

  try {
    const res = await fetch(ESPN_URLS[league]);
    const data = await res.json();
    const events = data.events || [];

    if (!events.length) {
      container.innerHTML = '<div class="scores-error">No games found right now. Check back during the season!</div>';
      return;
    }

    const cards = events.map(event => {
      const comp = event.competitions[0];
      const home = comp.competitors.find(c => c.homeAway === 'home');
      const away = comp.competitors.find(c => c.homeAway === 'away');
      const status = event.status.type;
      const homeScore = parseInt(home.score || 0);
      const awayScore = parseInt(away.score || 0);
      const homeWin = status.completed && homeScore > awayScore;
      const awayWin = status.completed && awayScore > homeScore;

      let statusText = '';
      let statusClass = '';
      if (status.completed) {
        statusText = 'Final';
      } else if (status.name === 'STATUS_IN_PROGRESS') {
        statusText = event.status.displayClock + ' · ' + (event.status.period ? 'Q' + event.status.period : '');
        statusClass = 'live';
      } else {
        statusText = event.date ? new Date(event.date).toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }) : 'Scheduled';
      }

      return `
        <div class="score-card">
          <div class="score-league">${league.toUpperCase()}</div>
          <div class="score-row">
            <span class="score-team ${awayWin ? 'winner' : status.completed ? 'loser' : ''}">${away.team.abbreviation}</span>
            <span class="score-num ${awayWin ? 'winner' : status.completed ? 'loser' : ''}">${status.completed || status.name === 'STATUS_IN_PROGRESS' ? away.score : '—'}</span>
          </div>
          <div class="score-row">
            <span class="score-team ${homeWin ? 'winner' : status.completed ? 'loser' : ''}">${home.team.abbreviation}</span>
            <span class="score-num ${homeWin ? 'winner' : status.completed ? 'loser' : ''}">${status.completed || status.name === 'STATUS_IN_PROGRESS' ? home.score : '—'}</span>
          </div>
          <div class="score-status ${statusClass}">${statusText}</div>
        </div>`;
    }).join('');

    container.innerHTML = '<div class="scores-grid">' + cards + '</div>';
  } catch (e) {
    container.innerHTML = '<div class="scores-error">Could not load scores. Please try again later.</div>';
  }
}
