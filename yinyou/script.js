document.addEventListener('DOMContentLoaded', () => {
    // 游戏元素
    const gameArea = document.getElementById('game-area');
    const judgeLine = document.getElementById('judge-line');
    const scoreElement = document.getElementById('score');
    const finalScoreElement = document.getElementById('final-score');
    const gameOverScreen = document.getElementById('game-over');
    const restartBtn = document.getElementById('restart-btn');

    // 游戏变量
    let score = 0;
    let gameSpeed = 2; // 初始下落速度
    let gameInterval;
    let keys = [];
    let isGameOver = false;
    let lastKeyTime = 0;
    const keySpawnInterval = 1500; // 初始生成键的间隔时间（毫秒）
    let currentKeySpawnInterval = keySpawnInterval;
    let speedIncreaseInterval;
    const keyWidth = 80; // 键的宽度，与CSS中保持一致
    const keyHeight = 30; // 键的高度
    const keyMargin = 20; // 键之间的最小间距

    // 判定区域范围（相对于判定线的位置）
    const perfectRange = 15; // 完美判定范围
    const earlyRange = 100; // 过早判定范围，超过这个范围的点击视为无效，而不是失败
    const lateToleranceRange = 25; // 晚按容忍范围，在这个范围内晚按仍算成功
    const earlyFailRange = 5; // 早按失败范围，在这个范围内早按会导致失败

    // 初始化游戏
    function initGame() {
        score = 0;
        gameSpeed = 2;
        currentKeySpawnInterval = keySpawnInterval;
        keys = [];
        isGameOver = false;
        scoreElement.textContent = '0';
        gameOverScreen.classList.add('hidden');
        
        // 清除所有现有的键
        const existingKeys = document.querySelectorAll('.key');
        existingKeys.forEach(key => key.remove());
        
        // 开始游戏循环
        startGameLoop();
        
        // 设置速度递增
        speedIncreaseInterval = setInterval(() => {
            gameSpeed += 0.2;
            currentKeySpawnInterval = Math.max(500, currentKeySpawnInterval - 50);
        }, 5000);
    }

 // 游戏主循环
 function startGameLoop() {
    // 生成新键的计时器
    let lastTime = 0;
    let multiKeyTimer = 0; // 用于控制多键生成
    let keyCount = 1; // 初始生成键的数量
   
    // 动画帧循环
    function gameLoop(timestamp) {
        if (isGameOver) return;
        
        // 生成新键
        if (!lastTime || timestamp - lastTime > currentKeySpawnInterval) {
            // 随机决定生成1-3个键
            const keysToGenerate = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < keysToGenerate; i++) {
                createKey();
            }
            lastTime = timestamp;
        }
        
        // 更新所有键的位置
        updateKeys();
        
        // 继续循环
        requestAnimationFrame(gameLoop);
    }
    
    requestAnimationFrame(gameLoop);
}

    // 创建新的键
    function createKey() {
        const key = document.createElement('div');
        key.className = 'key';
        key.style.top = '-30px'; // 从屏幕顶部开始
        
        // 修改随机水平位置（确保不会超出屏幕）
        const padding = 10; // 边缘安全距离
        const minLeft = padding;
        const maxLeft = gameArea.offsetWidth - keyWidth - padding;
        
        // 尝试找到一个不与现有键重叠的位置
        let validPosition = false;
        let attempts = 0;
        let randomLeft;
        
        while (!validPosition && attempts < 10) {
            randomLeft = Math.random() * (maxLeft - minLeft) + minLeft;
            validPosition = true;
            
            // 检查是否与现有键重叠
            for (const existingKey of keys) {
                if (existingKey.position < 50) { // 只检查顶部附近的键
                    const existingLeft = existingKey.left; // 使用存储的left值而不是解析样式
                    if (Math.abs(existingLeft - randomLeft) < (keyWidth + keyMargin)) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            attempts++;
        }
        
        // 如果找不到有效位置，可能是因为已经有太多键，就跳过这次生成
        if (!validPosition) {
            return;
        }
        
        // 设置为绝对像素值而不是百分比，以确保不超出边界
        key.style.left = `${randomLeft}px`;
        key.style.transform = 'none'; // 移除原来的transform居中
        
        gameArea.appendChild(key);
        
        // 将键添加到数组中进行跟踪
        keys.push({
            element: key,
            position: -30, // 初始垂直位置
            clicked: false,
            left: randomLeft,
            width: keyWidth
        });
    }

    // 更新所有键的位置
    function updateKeys() {
        // 修正判定线位置的获取方式
        const judgeLinePosition = judgeLine.offsetTop;

        for (let i = keys.length - 1; i >= 0; i--) {
            const key = keys[i];
                
            // 更新位置
            key.position += gameSpeed;
            key.element.style.top = `${key.position}px`;
                
            // 检查是否超出屏幕底部
            if (key.position > gameArea.offsetHeight) {
                if (!key.clicked) {
                    // 玩家错过了这个键
                    endGame();
                    return;
                }
                    
                // 移除超出屏幕的键
                key.element.remove();
                keys.splice(i, 1);
            }
        }
    }

    // 点击判定
    function handleClick(event) {
        if (isGameOver) return;
        
        // 防止连续快速点击
        const now = Date.now();
        if (now - lastKeyTime < 100) return;

        // 阻止默认行为和事件冒泡
        event.preventDefault();
        
        // 获取点击位置相对于游戏区域的坐标
        const rect = gameArea.getBoundingClientRect();
        let clickX;
        
        // 处理触摸事件和鼠标事件
        if (event.type === 'touchstart' || event.type === 'touchend') {
            // 触摸事件
            if (event.touches && event.touches.length > 0) {
                clickX = event.touches[0].clientX - rect.left;
            } else if (event.changedTouches && event.changedTouches.length > 0) {
                clickX = event.changedTouches[0].clientX - rect.left;
            } else {
                return; // 没有有效的触摸点
            }
        } else {
            // 鼠标事件
            clickX = event.clientX - rect.left;
        }
        
        const judgeLinePosition = judgeLine.offsetTop;
        let hitKey = false;
        
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key.clicked) continue;
            
            const keyTop = key.position;
            const keyBottom = keyTop + keyHeight;
            const keyLeft = key.left; // 使用存储的left值
            const keyRight = keyLeft + keyWidth;
            
            // 修改判定逻辑：只检查水平位置是否匹配，不再检查垂直位置
            const isInKeyColumn = (clickX >= keyLeft && clickX <= keyRight);
            
            if (!isInKeyColumn) continue; // 如果不在键的竖直区域内，跳过后续判断
            
            // 判断键是否在判定线范围内
            const distance = Math.abs(judgeLinePosition - keyBottom);
            
            // 完美判定 - 包括稍微晚按的容忍范围
            if (distance <= perfectRange || (keyBottom > judgeLinePosition && keyBottom <= judgeLinePosition + lateToleranceRange)) {
                // 完美判定
                key.clicked = true;
                key.element.classList.add('perfect-hit');
                score++;
                scoreElement.textContent = score;
                hitKey = true;
                lastKeyTime = now;
                break;
            } 
            // 早按一点点就失败
            else if (keyBottom > judgeLinePosition - perfectRange - earlyFailRange && keyBottom <= judgeLinePosition - perfectRange) {
                // 点击稍微早了一点，游戏结束
                endGame();
                return;
            }
            // 点击太早但在容忍范围内
            else if (keyBottom > judgeLinePosition - earlyRange && keyBottom < judgeLinePosition - perfectRange - earlyFailRange) {
                // 点击太早但在容忍范围内，视为无效点击而不是失败
                hitKey = true; // 标记为已点击，但不增加分数
                lastKeyTime = now;
                break;
            } 
            // 点击太晚，游戏结束
            else if (keyBottom > judgeLinePosition + lateToleranceRange && keyTop <= judgeLinePosition + perfectRange) {
                endGame();
                return;
            }
        }
        
        // 如果没有击中任何键或点击太早/太晚，不做任何处理
    }


    // 游戏结束
    function endGame() {
        isGameOver = true;
        clearInterval(speedIncreaseInterval);
        
        finalScoreElement.textContent = score;
        gameOverScreen.classList.remove('hidden');
    }

       // 事件监听 - 同时支持鼠标和触摸事件
    gameArea.addEventListener('click', handleClick);
    gameArea.addEventListener('touchstart', handleClick, { passive: false });
    restartBtn.addEventListener('click', initGame);
    restartBtn.addEventListener('touchstart', initGame, { passive: false });
    
    // 防止页面滚动
    document.body.addEventListener('touchmove', function(e) {
        if (e.target === gameArea || gameArea.contains(e.target)) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // 开始游戏
    initGame();
});