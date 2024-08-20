document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('formTodo');
    const inputTodo = document.getElementById('inputTodo');
    const inputAlarm = document.getElementById('inputAlarm');
    const inputTag = document.getElementById('inputTag');
    const msgError = document.getElementById('msgError');
    const listTodo = document.getElementById('listTodo');
    const counter = document.querySelector('.counter');

    let todos = JSON.parse(localStorage.getItem('todos')) || [];

    const updateCounter = () => {
        const total = todos.length;
        const completed = todos.filter(todo => todo.completed).length;
        const notCompleted = total - completed;
        counter.innerHTML = `할 일: ${total}개 완료: ${completed}개 미완료: ${notCompleted}개`;
    };

    const createTodoElement = (todo, index) => {
        const li = document.createElement('li');
        li.draggable = true;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => toggleComplete(index));

        const span = document.createElement('span');
        span.textContent = todo.text;
        if (todo.completed) {
            span.style.textDecoration = 'line-through';
            span.style.color = 'gray';
        }

        const alarm = document.createElement('span');
        alarm.innerHTML = todo.alarm ?
            ` | <span class="material-symbols-outlined">alarm</span> ${new Date(todo.alarm).toLocaleString()}` : '';
        alarm.style.marginLeft = '10px';

        const tag = document.createElement('span');
        tag.textContent = todo.tags ? ` | #: ${todo.tags.join(', ')}` : '';
        tag.style.marginLeft = '10px';

        const btnEdit = document.createElement('button');
        btnEdit.innerHTML = '<span class="material-symbols-outlined">edit</span>';
        btnEdit.addEventListener('click', () => editTodo(index));

        const btnDelete = document.createElement('button');
        btnDelete.innerHTML = '<span class="material-symbols-outlined">delete</span>';
        btnDelete.addEventListener('click', () => deleteTodo(index));

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(alarm);
        li.appendChild(tag);
        li.appendChild(btnEdit);
        li.appendChild(btnDelete);
        li.dataset.index = index;

        return li;
    };

    const renderTodos = () => {
        listTodo.innerHTML = '';
        todos.forEach((todo, index) => {
            listTodo.appendChild(createTodoElement(todo, index));
        });
        updateCounter();
    };

    const saveTodos = () => {
        localStorage.setItem('todos', JSON.stringify(todos));
    };

    const showError = (message) => {
        msgError.textContent = message;
        setTimeout(() => msgError.textContent = '', 3000);
    };

    const addTodo = (e) => {
        e.preventDefault();
        const text = inputTodo.value.trim();
        const alarm = inputAlarm.value;
        const tags = inputTag.value.split(' ').filter(tag => tag.trim() !== '');

        if (text === '') {
            showError('할 일을 입력해주세요.');
            return;
        }

        if (alarm && new Date(alarm) < new Date()) {
            showError('알람 시간은 현재 시간보다 이후여야 합니다.');
            return;
        }

        if (tags.some(tag => tag.length > 10)) {
            showError('태그는 10자를 넘길 수 없습니다.');
            return;
        }

        todos.push({
            text,
            alarm,
            tags,
            completed: false,
            alerted: false
        });

        saveTodos();
        renderTodos();
        form.reset();
    };

    const toggleComplete = (index) => {
        todos[index].completed = !todos[index].completed;
        saveTodos();
        renderTodos();
    };

    const deleteTodo = (index) => {
        todos.splice(index, 1);
        saveTodos();
        renderTodos();
    };

    const editTodo = (index) => {
        inputTodo.disabled = true;
        inputAlarm.disabled = true;
        inputTag.disabled = true;

        const li = listTodo.children[index];
        const todo = todos[index];

        li.innerHTML = `
        <input type="text" value="${todo.text}" id="editTodo">
        <input type="datetime-local" value="${todo.alarm ? new Date(todo.alarm).toISOString().slice(0, 16) : ''}" id="editAlarm">
        <input type="text" value="${todo.tags.join(' ')}" id="editTag" placeholder="태그(띄어쓰기 구분)">
        <div class="edit-buttons">
            <button id="btnSave">저장</button>
            <button id="btnCancel">취소</button>
        </div>
    `;

        const editTodo = document.getElementById('editTodo');
        const editAlarm = document.getElementById('editAlarm');
        const editTag = document.getElementById('editTag');

        document.getElementById('btnSave').addEventListener('click', () => {
        inputTodo.disabled = false;
        inputAlarm.disabled = false;
        inputTag.disabled = false;

            const updatedText = editTodo.value.trim();
            const updatedAlarm = editAlarm.value;
            const updatedTags = editTag.value.split(' ').filter(tag => tag.trim() !== '');

            if (updatedText === '') {
                showError('할 일을 입력해주세요.');
                return;
            }

            if (updatedAlarm && new Date(updatedAlarm) < new Date()) {
                showError('알람 시간은 현재 시간보다 이후여야 합니다.');
                return;
            }

            if (updatedTags.some(tag => tag.length > 10)) {
                showError('태그는 10자를 넘길 수 없습니다.');
                return;
            }

            todos[index] = {
                ...todos[index],
                text: updatedText,
                alarm: updatedAlarm,
                tags: updatedTags
            };

            saveTodos();
            renderTodos();
        });

        // document.getElementById('btnCancel').addEventListener('click', renderTodos);
        document.getElementById('btnCancel').addEventListener('click', function() {
            renderTodos();
            inputTodo.disabled = false;
            inputAlarm.disabled = false;
            inputTag.disabled = false;
        });
    };

    const checkAlarms = () => {
        const now = new Date().getTime();
        todos.forEach(todo => {
            if (todo.alarm && new Date(todo.alarm).getTime() <= now && !todo.alerted) {
                alert(`알람: ${todo.text}`);
                todo.alerted = true;
                saveTodos();
            }
        });
    };

    form.addEventListener('submit', addTodo);
    inputTodo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addTodo(e);
        }
    });

    let draggedIndex = null;

    // 드래그 시작 시 시각적 피드백 추가
    listTodo.addEventListener('dragstart', (e) => {
        draggedIndex = e.target.dataset.index;
        e.target.classList.add('dragging');
    });

    // 드래그 중 시각적 피드백 제거
    listTodo.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
        draggedIndex = null;
    });

    // 드래그 오버 시 드롭 가능 위치 시각적 표시
    listTodo.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(listTodo, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (afterElement == null) {
            listTodo.appendChild(draggable);
        } else {
            listTodo.insertBefore(draggable, afterElement);
        }
    });

    // 드래그 후 드롭하여 리스트 순서 업데이트
    listTodo.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetIndex = Array.from(listTodo.children).indexOf(e.target.closest('li'));
        if (draggedIndex !== null && targetIndex !== -1 && draggedIndex != targetIndex) {
            const [movedItem] = todos.splice(draggedIndex, 1);
            todos.splice(targetIndex, 0, movedItem);
            saveTodos();
            renderTodos();
        }
    });

    // 드래그 오버된 위치 확인 함수
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    setInterval(checkAlarms, 1000);

    renderTodos();
});
