/* advanced/app.js - 任务管理器逻辑 */
const STORAGE_KEY = 'advanced_todos_v1';
let tasks = [];
let filter = 'all';

// 元素引用
const taskForm = document.getElementById('taskForm');
const taskTitle = document.getElementById('taskTitle');
const taskDue = document.getElementById('taskDue');
const taskPriority = document.getElementById('taskPriority');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('search');
const filters = document.querySelectorAll('.filter');
const clearCompletedBtn = document.getElementById('clearCompleted');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');

// 初始化
load();
render();

// 事件绑定
taskForm.addEventListener('submit', e => {
  e.preventDefault();
  addTask();
});

searchInput.addEventListener('input', render);
filters.forEach(btn => btn.addEventListener('click', () => { filter = btn.dataset.filter; render(); }));
clearCompletedBtn.addEventListener('click', clearCompleted);
exportBtn.addEventListener('click', exportJSON);
importFile.addEventListener('change', handleImportFile);

// 添加任务
function addTask(){
  const title = taskTitle.value.trim();
  if(!title) return alert('请输入任务标题');
  const task = {
    id: Date.now().toString(),
    title,
    due: taskDue.value || null,
    priority: taskPriority.value,
    done: false,
    createdAt: new Date().toISOString()
  };
  tasks.unshift(task);
  save();
  render();
  taskForm.reset();
  taskTitle.focus();
}

// 保存到 localStorage
function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// 从 localStorage 加载
function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  }catch(e){
    tasks = [];
    console.error('加载任务失败', e);
  }
}

// 渲染任务列表
function render(){
  const q = searchInput.value.trim().toLowerCase();
  taskList.innerHTML = '';
  const filtered = tasks.filter(t => {
    if(filter === 'active' && t.done) return false;
    if(filter === 'completed' && !t.done) return false;
    if(q && !t.title.toLowerCase().includes(q)) return false;
    return true;
  });

  if(filtered.length === 0){
    taskList.innerHTML = '<li style="padding:12px;color:#6b7280">暂无任务</li>';
    return;
  }

  filtered.forEach(t => {
    const li = document.createElement('li');
    li.className = `task-item ${t.priority}`;

    const left = document.createElement('div');
    left.className = 'task-left';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = t.done;
    cb.addEventListener('change', () => { t.done = cb.checked; save(); render(); });

    const info = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = t.title + (t.done ? '（已完成）' : '');

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    meta.textContent = `优先：${t.priority} ${t.due ? '· 截止：'+t.due : ''}`;

    info.appendChild(title);
    info.appendChild(meta);

    left.appendChild(cb);
    left.appendChild(info);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', () => editTask(t.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn';
    delBtn.style.background = '#ef4444';
    delBtn.textContent = '删除';
    delBtn.addEventListener('click', () => { if(confirm('确认删除该任务？')) deleteTask(t.id); });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(left);
    li.appendChild(actions);

    taskList.appendChild(li);
  });
}

// 编辑任务（简化：通过 prompt）
function editTask(id){
  const t = tasks.find(x=>x.id===id);
  if(!t) return;
  const newTitle = prompt('编辑任务标题：', t.title);
  if(newTitle === null) return; // 取消
  t.title = newTitle.trim() || t.title;
  const newDue = prompt('编辑截止日期（YYYY-MM-DD），留空清除：', t.due||'');
  if(newDue === null) return;
  t.due = newDue.trim() || null;
  const newPriority = prompt('优先级（low/medium/high）：', t.priority);
  if(newPriority === null) return;
  if(['low','medium','high'].includes(newPriority)) t.priority = newPriority;
  save();
  render();
}

function deleteTask(id){
  tasks = tasks.filter(t=>t.id!==id);
  save();
  render();
}

function clearCompleted(){
  if(!confirm('清除所有已完成的任务？')) return;
  tasks = tasks.filter(t=>!t.done);
  save();
  render();
}

// 导出为 JSON 文件
function exportJSON(){
  const data = JSON.stringify(tasks, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tasks-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

// 通过文件导入 JSON
function handleImportFile(e){
  const f = e.target.files && e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const imported = JSON.parse(reader.result);
      if(!Array.isArray(imported)) throw new Error('格式错误');
      // 合并导入数据（保留现有）
      imported.forEach(item => {
        if(item && item.title){
          item.id = item.id || Date.now().toString() + Math.random();
          tasks.unshift(item);
        }
      });
      save();
      render();
      importFile.value = '';
      alert('导入完成');
    }catch(err){
      alert('导入失败：文件不是合法的任务 JSON');
    }
  };
  reader.readAsText(f);
}
