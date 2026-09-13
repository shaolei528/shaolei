export function updateHud(root, game, p = game.player) {
  const hearts = Array.from({ length: p.maxHp }, (_, i) => `<span class="heart ${i < p.hp ? '' : 'is-empty'}">♥</span>`).join('');
  root.innerHTML = `<div class="brand"><strong>深海搭档</strong><small>DEEP SEA DUO · CORE TEST</small></div><div class="stats"><div>${hearts}</div><b>${Math.floor(game.time)}s</b><small>Lv.${p.level} · ${p.xp}/${p.nextLevelXp} 食物</small></div>`;
}

export function showUpgrades(panel, choices, select) {
  panel.classList.remove('is-hidden'); panel.innerHTML = `<p>荧光进化</p><h2>选择一项强化</h2><div>${choices.map(choice => `<button data-id="${choice.id}"><strong>${choice.label}</strong><small>${choice.detail}</small></button>`).join('')}</div>`;
  panel.querySelectorAll('button').forEach(button => button.addEventListener('click', () => select(button.dataset.id)));
}
export function hideUpgrades(panel) { panel.classList.add('is-hidden'); panel.innerHTML = ''; }
