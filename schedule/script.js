// 全局变量
let tasks = [];
let currentMonth = new Date();
let selectedDate = null;

// DOM 加载完成后执行
document.addEventListener("DOMContentLoaded", function () {
  // 初始化步骤按钮
  initStepButtons();

  // 初始化任务添加功能
  initTaskInput();

  // 初始化日历
  updateCalendar(currentMonth);

  // 初始化月份导航
  document.getElementById("prevMonth").addEventListener("click", () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    updateCalendar(currentMonth);
  });

  document.getElementById("nextMonth").addEventListener("click", () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    updateCalendar(currentMonth);
  });

  // 返回日历视图
  document.getElementById("backToCalendar").addEventListener("click", () => {
    document.getElementById("daySchedule").classList.add("hidden");
    document.querySelector(".calendar-view").classList.remove("hidden");
  });

  // 保存日程按钮
  document.getElementById("saveScheduleBtn").addEventListener("click", () => {
    saveSchedule();
  });

  // 重新开始按钮
  document.getElementById("restartBtn").addEventListener("click", () => {
    if (confirm("确定要重新开始？所有已添加的任务将被清除。")) {
      resetApp();
    }
  });
});

// 初始化步骤按钮
function initStepButtons() {
  // 步骤1到步骤2
  document.getElementById("step1NextBtn").addEventListener("click", () => {
    if (tasks.length > 0) {
      gotoStep(2);
      renderPriorityList();
    }
  });

  // 步骤2返回步骤1
  document.getElementById("step2BackBtn").addEventListener("click", () => {
    gotoStep(1);
  });

  // 步骤2到步骤3
  document.getElementById("step2NextBtn").addEventListener("click", () => {
    updateTaskPriorities();
    gotoStep(3);
    renderTaskDetails();
  });

  // 步骤3返回步骤2
  document.getElementById("step3BackBtn").addEventListener("click", () => {
    gotoStep(2);
  });

  // 步骤3到步骤4
  document.getElementById("step3NextBtn").addEventListener("click", () => {
    if (validateTaskDetails()) {
      updateTaskDetails();
      gotoStep(4);
      generateSchedule();
    }
  });

  // 步骤4返回步骤3
  document.getElementById("step4BackBtn").addEventListener("click", () => {
    gotoStep(3);
  });
}

// 切换到指定步骤
function gotoStep(stepNumber) {
  // 隐藏所有步骤
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.add("hidden");
  });

  // 显示目标步骤
  document.getElementById(`step${stepNumber}`).classList.remove("hidden");

  // 更新步骤指示器
  updateStepIndicators(stepNumber);

  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 更新步骤指示器
function updateStepIndicators(currentStep) {
  const steps = document.querySelectorAll(".step-circle");
  const lines = document.querySelectorAll(".step-line");
  const names = document.querySelectorAll(".step-name");

  steps.forEach((step, index) => {
    const stepNum = index + 1;
    step.classList.remove("active", "completed");
    names[index].classList.remove("active");

    if (stepNum < currentStep) {
      step.classList.add("completed");
      step.innerHTML = '<i class="fas fa-check"></i>';
    } else if (stepNum === currentStep) {
      step.classList.add("active");
      step.textContent = stepNum;
      names[index].classList.add("active");
    } else {
      step.textContent = stepNum;
    }
  });

  lines.forEach((line, index) => {
    line.classList.remove("active");
    if (index < currentStep - 1) {
      line.classList.add("active");
    }
  });
}

// 初始化任务输入
function initTaskInput() {
  const taskInput = document.getElementById("taskInput");
  const addTaskBtn = document.getElementById("addTaskBtn");
  const taskList = document.getElementById("taskList");
  const taskError = document.getElementById("taskError");
  const nextBtn = document.getElementById("step1NextBtn");

  // 添加任务按钮点击事件
  addTaskBtn.addEventListener("click", () => {
    addTask();
  });

  // 输入框回车事件
  taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  });

  // 添加任务函数
  function addTask() {
    const taskName = taskInput.value.trim();

    if (!taskName) {
      showError("请输入任务名称");
      return;
    }

    if (tasks.length >= 10) {
      showError("你总不会分身吧？最多只能添加10个任务");
      return;
    }

    if (tasks.some((task) => task.name === taskName)) {
      showError("任务名称不能重复");
      return;
    }

    // 添加新任务
    const newTask = {
      id: Date.now(),
      name: taskName,
      priority: tasks.length + 1,
      deadline: "",
      interest: 3,
      estimatedHours: 1,
      complexity: 3,
    };

    tasks.push(newTask);

    // 更新UI
    renderTasks();

    // 清空输入框
    taskInput.value = "";
    taskInput.focus();

    // 清除错误消息
    taskError.textContent = "";

    // 启用下一步按钮
    nextBtn.disabled = false;
  }

  // 显示错误信息
  function showError(message) {
    taskError.textContent = message;
    taskError.classList.add("pulse");

    setTimeout(() => {
      taskError.classList.remove("pulse");
    }, 1500);

    taskInput.focus();
  }
}

// 渲染任务列表
function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.id = task.id;

    li.innerHTML = `
            <span class="task-name">${task.name}</span>
            <div class="task-actions">
                <button class="delete-task" title="删除任务"><i class="fas fa-trash"></i></button>
            </div>
        `;

    taskList.appendChild(li);

    // 添加删除任务事件
    li.querySelector(".delete-task").addEventListener("click", () => {
      deleteTask(task.id);
    });
  });
}

// 删除任务
function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  renderTasks();

  // 如果没有任务，禁用下一步按钮
  if (tasks.length === 0) {
    document.getElementById("step1NextBtn").disabled = true;
  }
}

// 渲染优先级列表
function renderPriorityList() {
  const priorityList = document.getElementById("priorityList");
  priorityList.innerHTML = "";

  // 按当前优先级排序
  const sortedTasks = [...tasks].sort((a, b) => a.priority - b.priority);

  sortedTasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = "priority-item";
    li.dataset.id = task.id;

    li.innerHTML = `
            <div class="priority-handle">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="priority-rank">${index + 1}</div>
            <div class="priority-name">${task.name}</div>
        `;

    priorityList.appendChild(li);
  });

  // 初始化拖拽排序
  new Sortable(priorityList, {
    animation: 150,
    handle: ".priority-handle",
    ghostClass: "sortable-ghost",
    dragClass: "sortable-drag",
    onEnd: function () {
      // 更新排名显示
      const items = priorityList.querySelectorAll(".priority-item");
      items.forEach((item, index) => {
        item.querySelector(".priority-rank").textContent = index + 1;
      });
    },
  });
}

// 更新任务优先级
function updateTaskPriorities() {
  const priorityList = document.getElementById("priorityList");
  const items = priorityList.querySelectorAll(".priority-item");

  items.forEach((item, index) => {
    const taskId = parseInt(item.dataset.id);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      task.priority = index + 1;
    }
  });
}

// 渲染任务详细信息表单
function renderTaskDetails() {
  const container = document.getElementById("taskDetailsContainer");
  container.innerHTML = "";

  // 按优先级排序
  const sortedTasks = [...tasks].sort((a, b) => a.priority - b.priority);

  sortedTasks.forEach((task, index) => {
    const card = document.createElement("div");
    card.className = "task-detail-card";
    card.dataset.id = task.id;

    // 根据优先级添加样式类
    if (index === 0) {
      card.classList.add("priority-high");
    } else if (index < 3) {
      card.classList.add("priority-medium");
    } else {
      card.classList.add("priority-low");
    }

    card.innerHTML = `
            <div class="task-detail-header">
                <div class="task-detail-number">${index + 1}</div>
                <div class="task-detail-title">${task.name}</div>
            </div>
            <div class="task-detail-form">
                <div class="form-group">
                    <label for="deadline-${task.id}">截止日期</label>
                    <input type="text" class="form-control task-deadline" id="deadline-${
                      task.id
                    }" placeholder="选择日期" value="${task.deadline || ""}">
                </div>
                <div class="form-group">
                    <label for="hours-${task.id}">预计需要时间（小时）</label>
                    <input type="number" class="form-control task-hours" id="hours-${
                      task.id
                    }" min="0.5" max="100" step="0.5" value="${
      task.estimatedHours || 1
    }">
                </div>
                <div class="form-group">
                    <label for="interest-${task.id}">兴趣程度</label>
                    <div class="slider-container">
                        <input type="range" class="range-slider task-interest" id="interest-${
                          task.id
                        }" min="1" max="5" value="${task.interest || 3}">
                        <div class="range-labels">
                            <span>非常低</span>
                            <span>低</span>
                            <span>中等</span>
                            <span>高</span>
                            <span>非常高</span>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="complexity-${task.id}">任务复杂度</label>
                    <div class="slider-container">
                        <input type="range" class="range-slider task-complexity" id="complexity-${
                          task.id
                        }" min="1" max="5" value="${task.complexity || 3}">
                        <div class="range-labels">
                            <span>很简单</span>
                            <span>简单</span>
                            <span>中等</span>
                            <span>复杂</span>
                            <span>很复杂</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

    container.appendChild(card);

    // 初始化日期选择器
    flatpickr(`#deadline-${task.id}`, {
      locale: "zh",
      dateFormat: "Y-m-d",
      minDate: "today",
      allowInput: true,
    });
  });
}
// 验证任务详细信息
function validateTaskDetails() {
  let isValid = true;

  tasks.forEach((task) => {
    const deadlineInput = document.getElementById(`deadline-${task.id}`);

    if (!deadlineInput.value) {
      alert(`请为任务"${task.name}"设置截止日期`);
      deadlineInput.focus();
      isValid = false;
      return false;
    }
  });

  return isValid;
}

// 更新任务详细信息
function updateTaskDetails() {
  tasks.forEach((task) => {
    task.deadline = document.getElementById(`deadline-${task.id}`).value;
    task.estimatedHours = parseFloat(
      document.getElementById(`hours-${task.id}`).value
    );
    task.interest = parseInt(
      document.getElementById(`interest-${task.id}`).value
    );
    task.complexity = parseInt(
      document.getElementById(`complexity-${task.id}`).value
    );
  });
}

// 生成日程规划表
function generateSchedule() {
  // 清空现有日程
  tasks.forEach((task) => {
    task.scheduledDates = [];
    task.completed = false;
  });

  // 按优先级和截止日期排序任务
  const sortedTasks = [...tasks].sort((a, b) => {
    // 首先按优先级排序
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    // 其次按截止日期排序
    const dateA = new Date(a.deadline);
    const dateB = new Date(b.deadline);
    return dateA - dateB;
  });

  // 计算任务分数（用于排序和分配时间）
  sortedTasks.forEach((task) => {
    // 基础分数 = 优先级（倒序）* 2 + 兴趣程度 - 复杂度
    let score = (11 - task.priority) * 2 + task.interest - task.complexity;

    // 截止日期因素
    const deadline = new Date(task.deadline);
    const today = new Date();
    const daysUntilDeadline = Math.ceil(
      (deadline - today) / (1000 * 60 * 60 * 24)
    );

    // 截止日期紧迫度分数
    let urgencyScore = 0;
    if (daysUntilDeadline <= 1) {
      urgencyScore = 10; // 非常紧急
    } else if (daysUntilDeadline <= 3) {
      urgencyScore = 8; // 紧急
    } else if (daysUntilDeadline <= 7) {
      urgencyScore = 5; // 一般紧急
    } else if (daysUntilDeadline <= 14) {
      urgencyScore = 3; // 不太紧急
    } else {
      urgencyScore = 1; // 不紧急
    }

    // 总分 = 基础分数 + 紧迫度
    task.score = score + urgencyScore;

    // 计算任务的总工作时间（考虑复杂度）
    // 复杂度越高，实际时间相对预估时间越长
    const complexityFactor = 0.8 + task.complexity * 0.1; // 复杂度因子范围：0.9-1.3
    task.totalWorkHours = task.estimatedHours * complexityFactor;

    // 计算每天可以分配的工作时间
    // 兴趣度越高，每天可以投入的时间越多
    const interestFactor = 0.8 + task.interest * 0.1; // 兴趣因子范围：0.9-1.3
    task.hoursPerDay = Math.min(4, task.totalWorkHours) * interestFactor;

    // 计算需要多少天完成
    task.daysNeeded = Math.ceil(task.totalWorkHours / task.hoursPerDay);
  });

  // 重新排序，按照分数和紧迫性排序
  sortedTasks.sort((a, b) => b.score - a.score);

  // 分配任务到日期
  const scheduledDates = {};
  const today = new Date();

  sortedTasks.forEach((task) => {
    // 截止日期
    const deadline = new Date(task.deadline);

    // 从今天开始安排
    let currentDay = new Date(today);
    let daysAllocated = 0;

    // 每天最多安排8小时的工作
    const MAX_HOURS_PER_DAY = 8;

    while (daysAllocated < task.daysNeeded && currentDay <= deadline) {
      const dateStr = formatDate(currentDay);

      // 初始化当天的已安排工作时间
      if (!scheduledDates[dateStr]) {
        scheduledDates[dateStr] = {
          totalHours: 0,
          tasks: [],
        };
      }

      // 如果当天还有足够的时间
      if (scheduledDates[dateStr].totalHours < MAX_HOURS_PER_DAY) {
        // 计算当天可以为这个任务分配的时间
        const availableHours =
          MAX_HOURS_PER_DAY - scheduledDates[dateStr].totalHours;
        const allocatedHours = Math.min(availableHours, task.hoursPerDay);

        // 分配任务
        scheduledDates[dateStr].tasks.push({
          id: task.id,
          name: task.name,
          hours: allocatedHours,
          priority: task.priority,
          score: task.score,
        });

        // 更新当天总工作时间
        scheduledDates[dateStr].totalHours += allocatedHours;

        // 更新任务的调度日期
        if (!task.scheduledDates) {
          task.scheduledDates = [];
        }
        task.scheduledDates.push(dateStr);

        daysAllocated++;
      }

      // 移到下一天
      currentDay.setDate(currentDay.getDate() + 1);
    }
  });

  // 保存日程数据
  window.scheduledDates = scheduledDates;

  // 更新日历视图
  updateCalendar(currentMonth);
}

// 日期格式化函数
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 解析日期字符串为Date对象
function parseDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map((num) => parseInt(num));
  return new Date(year, month - 1, day);
}

// 更新日历视图
function updateCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  // 更新月份标题
  const monthNames = [
    "一月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "十一月",
    "十二月",
  ];
  document.getElementById(
    "currentMonth"
  ).textContent = `${year}年 ${monthNames[month]}`;

  const calendarDays = document.getElementById("calendarDays");
  calendarDays.innerHTML = "";

  // 获取本月第一天
  const firstDay = new Date(year, month, 1);
  // 获取本月最后一天
  const lastDay = new Date(year, month + 1, 0);

  // 计算本月第一天是星期几
  const firstDayIndex = firstDay.getDay();

  // 获取今天的日期
  const today = new Date();
  const todayString = formatDate(today);

  // 填充上个月的日期
  for (let i = 0; i < firstDayIndex; i++) {
    const prevMonthDay = new Date(year, month, -i);
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day previous-month";
    dayDiv.innerHTML = `<div class="calendar-day-number">${prevMonthDay.getDate()}</div>`;
    calendarDays.appendChild(dayDiv);
  }

  // 填充本月的日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const currentDate = new Date(year, month, i);
    const dateString = formatDate(currentDate);

    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";

    // 如果是今天，添加特殊样式
    if (dateString === todayString) {
      dayDiv.classList.add("today");
    }

    dayDiv.innerHTML = `<div class="calendar-day-number">${i}</div>`;

    // 添加任务标记
    if (window.scheduledDates && window.scheduledDates[dateString]) {
      dayDiv.classList.add("has-tasks");

      const tasksDiv = document.createElement("div");
      tasksDiv.className = "calendar-tasks";

      // 最多显示3个任务，多了显示省略号
      const tasks = window.scheduledDates[dateString].tasks;
      const tasksToShow = tasks.slice(0, 3);

      tasksToShow.forEach((task) => {
        const taskDot = document.createElement("div");
        taskDot.className = "calendar-task-dot";

        // 根据优先级设置颜色
        if (task.priority <= 1) {
          taskDot.classList.add("task-dot-high");
        } else if (task.priority <= 3) {
          taskDot.classList.add("task-dot-medium");
        } else {
          taskDot.classList.add("task-dot-low");
        }

        taskDot.textContent = task.name;
        tasksDiv.appendChild(taskDot);
      });

      if (tasks.length > 3) {
        const moreDot = document.createElement("div");
        moreDot.className = "calendar-task-dot";
        moreDot.textContent = `+${tasks.length - 3} 更多`;
        tasksDiv.appendChild(moreDot);
      }

      dayDiv.appendChild(tasksDiv);
    }

    // 添加点击事件，查看当天日程
    dayDiv.addEventListener("click", () => {
      viewDaySchedule(dateString);
    });

    calendarDays.appendChild(dayDiv);
  }

  // 填充下个月的日期（确保日历显示6行）
  const totalDaysVisible = firstDayIndex + lastDay.getDate();
  const nextMonthDays = 42 - totalDaysVisible; // 6行 x 7天 = 42

  for (let i = 1; i <= nextMonthDays; i++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day next-month";
    dayDiv.innerHTML = `<div class="calendar-day-number">${i}</div>`;
    calendarDays.appendChild(dayDiv);
  }
}

// 查看某一天的日程
function viewDaySchedule(dateStr) {
  const date = parseDate(dateStr);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };
  const formattedDate = date.toLocaleDateString("zh-CN", options);

  document.getElementById("selectedDate").textContent = formattedDate;

  const content = document.getElementById("dayScheduleContent");
  content.innerHTML = "";

  // 隐藏日历视图，显示日程视图
  document.querySelector(".calendar-view").classList.add("hidden");
  document.getElementById("daySchedule").classList.remove("hidden");

  // 没有任务的情况
  if (
    !window.scheduledDates ||
    !window.scheduledDates[dateStr] ||
    window.scheduledDates[dateStr].tasks.length === 0
  ) {
    content.innerHTML = `
            <div class="day-empty-message">
                <i class="fas fa-coffee fa-3x"></i>
                <p>这一天暂时没有安排任务</p>
            </div>
        `;
    return;
  }

  // 获取该日的任务，并按优先级排序
  const dayTasks = window.scheduledDates[dateStr].tasks.sort(
    (a, b) => a.priority - b.priority
  );

  // 计算日程开始时间（默认早上9点开始）
  let startHour = 9;
  let totalHours = 0;

  dayTasks.forEach((task) => {
    const taskDiv = document.createElement("div");
    taskDiv.className = "day-task";

    // 根据优先级设置颜色
    if (task.priority <= 1) {
      taskDiv.classList.add("priority-high");
    } else if (task.priority <= 3) {
      taskDiv.classList.add("priority-medium");
    } else {
      taskDiv.classList.add("priority-low");
    }

    // 计算当前任务的时间段
    const taskStartHour = startHour + totalHours;
    const taskEndHour = taskStartHour + task.hours;

    // 格式化时间
    const startTime = formatTime(taskStartHour);
    const endTime = formatTime(taskEndHour);

    taskDiv.innerHTML = `
            <div class="day-task-header">
                <div class="day-task-title">${task.name}</div>
                <div class="day-task-time">${startTime} - ${endTime}</div>
            </div>
            <div class="day-task-details">
                <p>预计耗时: ${task.hours.toFixed(1)}小时</p>
            </div>
        `;

    content.appendChild(taskDiv);

    // 更新累计时间
    totalHours += task.hours;
  });
}

// 格式化时间（小时分钟）
function formatTime(hours) {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  let hourStr = wholeHours.toString();
  let minStr = minutes.toString().padStart(2, "0");

  return `${hourStr}:${minStr}`;
}

// 保存日程
function saveSchedule() {
  try {
    // 创建用于保存的数据
    const saveData = {
      tasks: tasks,
      scheduledDates: window.scheduledDates,
      savedAt: new Date().toISOString(),
    };

    // 保存到本地存储
    localStorage.setItem("schedulePlanner", JSON.stringify(saveData));

    // 显示成功消息
    alert("日程已成功保存！");
  } catch (e) {
    console.error("保存失败", e);
    alert("保存失败，请稍后再试");
  }
}

// 加载保存的日程
function loadSavedSchedule() {
  try {
    const savedData = localStorage.getItem("schedulePlanner");

    if (savedData) {
      const data = JSON.parse(savedData);

      if (data.tasks && data.scheduledDates) {
        tasks = data.tasks;
        window.scheduledDates = data.scheduledDates;

        // 更新任务列表
        renderTasks();

        // 启用下一步按钮
        document.getElementById("step1NextBtn").disabled = false;

        // 更新日历
        updateCalendar(currentMonth);

        return true;
      }
    }

    return false;
  } catch (e) {
    console.error("加载失败", e);
    return false;
  }
}

// 尝试加载保存的日程
window.addEventListener("load", function () {
  if (loadSavedSchedule()) {
    // 如果加载成功，询问是否要继续编辑
    if (confirm("找到已保存的日程规划，是否继续编辑？")) {
      // 用户选择继续编辑，不执行任何额外操作
    } else {
      // 用户选择不继续编辑，重置应用
      resetApp();
    }
  }
});

// 重置应用
function resetApp() {
  // 清空任务
  tasks = [];

  // 清空日程
  window.scheduledDates = {};

  // 清空UI
  renderTasks();

  // 禁用下一步按钮
  document.getElementById("step1NextBtn").disabled = true;

  // 重置到第一步
  gotoStep(1);

  // 更新日历
  updateCalendar(currentMonth);

  // 清空本地存储
  localStorage.removeItem("schedulePlanner");
}
