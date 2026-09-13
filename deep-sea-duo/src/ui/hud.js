import { t, upgradeText } from '../i18n.js';

export function updateHud(root, game, p = game.player) {
  const hearts = Array.from({ length: p.maxHp }, (_, i) => `<span class="heart ${i < p.hp ? '' : 'is-empty'}">♥</span>`).join('');
  root.innerHTML = `
    <div class="brand">
      <strong>${t('gameTitle')}</strong>
      <small>${t('subtitle')}</small>
    </div>
    <div class="stats">
      <div>${hearts}</div>
      <b>${Math.floor(game.time)}s</b>
      <small>${t('level')} ${p.level} · ${p.xp}/${p.nextLevelXp} ${t('food')}</small>
    </div>`;
}

export function showUpgrades(panel, choices, select) {
  panel.classList.remove('is-hidden');
  panel.innerHTML = `
    <p>${t('evolution')}</p>
    <h2>${t('chooseUpgrade')}</h2>
    <div>${choices.map(choice => {
      const copy = upgradeText(choice.id);
      return `<button data-id="${choice.id}"><strong>${copy.label}</strong><small>${copy.detail}</small></button>`;
    }).join('')}</div>`;
  panel.querySelectorAll('button').forEach(button => button.addEventListener('click', () => select(button.dataset.id)));
}

export function hideUpgrades(panel) {
  panel.classList.add('is-hidden');
  panel.innerHTML = '';
}
