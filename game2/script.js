const GameManager = {
  init() {
    this.state = {
      player: { hp: 10, mp: 50, selectedCard: null, defense: 0 },
      ai: { hp: 10, mp: 50, selectedCard: null, defense: 0 },
      distance: 5,
      maxDistance: 10,
      turn: 1,
      skills: [
        {
          name: "前冲",
          damage: 2,
          range: 2,
          move: 2,
          mpCost: 2,
          type: "attack",
        },
        {
          name: "防守",
          damage: 0,
          range: 0,
          move: 0,
          mpCost: 1,
          type: "defend",
          defense: 2,
        },
        {
          name: "劈砍",
          damage: 3,
          range: 2,
          move: 0,
          mpCost: 2,
          type: "attack",
        },
        {
          name: "魔法球",
          damage: 1,
          range: "infinite",
          move: 0,
          mpCost: 1,
          type: "attack",
        },
        {
          name: "治疗术",
          damage: -3,
          range: 0,
          move: 0,
          mpCost: 3,
          type: "heal",
        },
        {
          name: "后撤",
          damage: 0,
          range: 0,
          move: -2,
          mpCost: 1,
          type: "move",
        },
        {
          name: "闪电链",
          damage: 2,
          range: 3,
          move: 0,
          mpCost: 2,
          type: "attack",
          chain: 2,
        },
        {
          name: "冲锋",
          damage: 1,
          range: 1,
          move: 3,
          mpCost: 3,
          type: "attack",
        },
      ],
      playerHand: [],
      aiHand: [],
    };

    this.dom = {
      confirmBtn: document.getElementById("confirm-button"),
      restartBtn: document.getElementById("restart-button"),
      cardSelection: document.getElementById("card-selection"),
      resultDisplay: document.getElementById("result-display"),
    };

    this.bindEvents();
    this.resetGame();
  },

  bindEvents() {
    this.dom.confirmBtn.addEventListener("click", () => this.resolveBattle());
    this.dom.restartBtn.addEventListener("click", () => this.resetGame());
  },

  resetGame() {
    this.state = {
      ...this.state,
      player: { ...this.state.player, hp: 10, mp: 50, defense: 0 },
      ai: { ...this.state.ai, hp: 10, mp: 50, defense: 0 },
      distance: 5,
      turn: 1,
    };
    this.dom.resultDisplay.style.display = "none";
    this.drawCards();
    this.updateUI();
  },

  drawCards() {
    this.state.playerHand = this.getUniqueCards(3);
    this.state.aiHand = this.getUniqueCards(3);
    this.state.player.selectedCard = null;
    this.state.ai.selectedCard = null;
    this.renderCards();
  },

  getUniqueCards(count) {
    const available = [...this.state.skills];
    const selected = [];
    while (selected.length < count && available.length > 0) {
      const randomIndex = Math.floor(Math.random() * available.length);
      selected.push(available.splice(randomIndex, 1)[0]);
    }
    return selected;
  },

  renderCards() {
    this.dom.cardSelection.innerHTML = "";
    this.state.playerHand.forEach((card, index) => {
      const cardElement = document.createElement("div");
      cardElement.className = "card";
      cardElement.innerHTML = `
        <div class="card-name">${card.name}</div>
        <div class="card-details">伤害: ${card.damage}</div>
        <div class="card-details">范围: ${card.range}</div>
        <div class="card-details">移动: ${card.move}</div>
        <div class="card-cost">消耗: ${card.mpCost}</div>
      `;
      cardElement.addEventListener("click", () => this.selectCard(index));
      this.dom.cardSelection.appendChild(cardElement);
    });
  },

  selectCard(index) {
    this.state.player.selectedCard = index;
    document.querySelectorAll(".card").forEach((card, i) => {
      card.classList.toggle("selected", i === index);
      card.style.pointerEvents = i === index ? "none" : "auto";
    });
  },

  updateCharacterPositions() {
    const fieldWidth = document.querySelector(".battle-field").offsetWidth;
    const maxVisibleDistance = fieldWidth * 0.6;
    const playerX =
      (maxVisibleDistance * this.state.distance) / this.state.maxDistance;
    const aiX =
      maxVisibleDistance -
      (maxVisibleDistance * this.state.distance) / this.state.maxDistance;
    document.getElementById("player-character").style.left = `${playerX}px`;
    document.getElementById("ai-character").style.right = `${aiX}px`;
  },

  executeSkill(character, card) {
    character.mp -= card.mpCost;
    if (card.move !== 0) {
      const moveValue =
        character === this.state.player ? -card.move : card.move;
      this.state.distance = Math.min(
        this.state.maxDistance,
        Math.max(0, this.state.distance + moveValue)
      );
    }

    if (card.type === "attack" && this.isInRange(card.range)) {
      const target =
        character === this.state.player ? this.state.ai : this.state.player;
      const damage = Math.max(0, card.damage - target.defense);
      target.hp -= damage;
      target.defense = 0;
      this.playSound("attack");
    }

    if (card.type === "heal") {
      character.hp = Math.min(10, character.hp - card.damage);
      this.playSound("heal");
    }

    if (card.type === "defend") {
      character.defense += card.defense;
    }

    this.playAnimation(character, card.name);
  },

  isInRange(range) {
    if (range === "infinite") return true;
    return this.state.distance <= range;
  },

  resolveBattle() {
    const playerCard = this.state.playerHand[this.state.player.selectedCard];
    if (!playerCard) {
      alert("请选择一张卡牌！");
      return;
    }
    if (this.state.player.mp < playerCard.mpCost) {
      alert("蓝量不足！");
      this.resetTurn();
      return;
    }

    const validAICards = this.state.aiHand.filter(
      (card) => this.state.ai.mp >= card.mpCost
    );
    this.state.ai.selectedCard =
      validAICards.length > 0
        ? this.state.aiHand.indexOf(
            validAICards[Math.floor(Math.random() * validAICards.length)]
          )
        : -1;

    this.executeSkill(this.state.player, playerCard);
    if (this.state.ai.selectedCard !== -1) {
      const aiCard = this.state.aiHand[this.state.ai.selectedCard];
      this.executeSkill(this.state.ai, aiCard);
    }

    this.updateUI();
    if (this.state.player.hp <= 0 || this.state.ai.hp <= 0) {
      this.endGame();
    } else {
      setTimeout(() => {
        this.state.turn++;
        this.resetTurn();
      }, 1500);
    }
  },

  updateUI() {
    document.getElementById("player-hp").textContent = this.state.player.hp;
    document.getElementById("player-mp").textContent = this.state.player.mp;
    document.getElementById("ai-hp").textContent = this.state.ai.hp;
    document.getElementById("ai-mp").textContent = this.state.ai.mp;
    document.getElementById("distance").textContent = this.state.distance;
    document.getElementById("turn-number").textContent = this.state.turn;
    this.updateCharacterPositions();

    document.querySelectorAll(".status").forEach((status) => {
      const value = parseInt(status.textContent.split(": ")[1]);
      if (status.classList.contains("hp")) {
        status.style.setProperty("--hp-percent", `${(value / 10) * 100}%`);
      } else {
        status.style.setProperty("--mp-percent", `${(value / 50) * 100}%`);
      }
    });
  },

  endGame() {
    this.dom.resultDisplay.style.display = "block";
    this.dom.resultDisplay.innerHTML = `
      ${this.state.player.hp <= 0 ? "你输了！" : "你赢了！"}<br>
      你的血量: ${this.state.player.hp}<br>
      敌方血量: ${this.state.ai.hp}
    `;
    this.dom.restartBtn.style.display = "block";
  },

  resetTurn() {
    this.state.player.selectedCard = null;
    this.state.ai.selectedCard = null;
    document.querySelectorAll(".card").forEach((card) => {
      card.classList.remove("selected");
      card.style.pointerEvents = "auto";
    });
    this.drawCards();
    this.updateUI();
  },

  playAnimation(character, skillName) {
    const charElement =
      character === this.state.player
        ? document.getElementById("player-character")
        : document.getElementById("ai-character");

    const animations = {
      前冲: "dash-forward",
      冲锋: "dash-forward",
      劈砍: "attack-slash",
      闪电链: "attack-slash",
      防守: "defend",
    };

    if (animations[skillName]) {
      charElement.classList.add(animations[skillName]);
      setTimeout(
        () => charElement.classList.remove(animations[skillName]),
        500
      );
    }
  },

  playSound(type) {
    const sound = document.getElementById(`${type}-sound`);
    if (sound) {
      sound.currentTime = 0;
      sound.play();
    }
  },
};

GameManager.init();
