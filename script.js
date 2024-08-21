document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('formTodo');
    const inputTodo = document.getElementById('inputTodo');
    const inputAlarm = document.getElementById('inputAlarm');
    const inputTag = document.getElementById('inputTag');
    const msgError = document.getElementById('msgError');
    const listTodo = document.getElementById('listTodo');
    const counter = document.querySelector('.counter');

    let todos = JSON.parse(localStorage.getItem('todos')) || [];    // 로컬 스토리지에 추가한 'todos'를 읽어서 JSON 형태로 변환

    const updateCounter = () => {   // 할 일 개수, 완료한 개수, 미완료한 개수를 카운팅하여 출력
        const total = todos.length;
        const completed = todos.filter(todo => todo.completed).length;
        const notCompleted = total - completed;
        // counter.innerHTML = `할 일: ${total}개 완료: ${completed}개 미완료: ${notCompleted}개`;
        counter.textContent = `할 일: ${total}개 | 완료: ${completed}개 | 미완료: ${notCompleted}개`;
    };

    const createTodoElement = (todo, index) => {    // 리스트에 입력 요소 추가
        const li = document.createElement('li');
        li.draggable = true;    // 드래그 가능하도록 설정

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;  // 체크박스의 체크 여부를 할 일의 완료 여부에 따라 설정
        checkbox.addEventListener('change', () => toggleComplete(index));   // 체크박스의 체크 여부가 변경될 때 할 일의 완료 여부를 토글

        const span = document.createElement('span');    // 할 일 내용을 출력하는 span 요소 생성
        span.textContent = todo.text;
        span.style.wordBreak = 'keep-all';  // 글자가 길어질 때 줄바꿈을 하지 않고 글자를 끊어서 출력
        if (todo.completed) {   // 할 일이 완료된 경우 취소선을 추가하고 글자색을 회색으로 변경
            span.style.textDecoration = 'line-through';
            span.style.color = 'gray';
        }

        const alarm = document.createElement('span');
        // alarm.innerHTML = todo.alarm ?
        //     ` | <span class="material-symbols-outlined">alarm</span> ${new Date(todo.alarm).toLocaleString()}` : '';
        alarm.textContent = todo.alarm ? ` | 알람: ${new Date(todo.alarm).toLocaleString()}` : '';  // 삼항 연산자를 사용하여 알람 시간이 있으면 출력
        alarm.style.marginLeft = '1rem';
        if (todo.completed) {   // 할 일이 완료된 경우 취소선을 추가하고 글자색을 회색으로 변경
            alarm.style.textDecoration = 'line-through';
            alarm.style.color = 'gray';
        }

        const tag = document.createElement('span');
        tag.textContent = todo.tags ? ` | #: ${todo.tags.join(', ')}` : '';
        tag.style.marginLeft = '1rem';
        if (todo.completed) {   // 할 일이 완료된 경우 취소선을 추가하고 글자색을 회색으로 변경
            tag.style.textDecoration = 'line-through';
            tag.style.color = 'gray';
        }

        const btnEdit = document.createElement('button');
        // btnEdit.innerHTML = '<span class="material-symbols-outlined">edit</span>';
        btnEdit.textContent = '수정';
        if (todo.completed) {   // 할 일이 완료된 경우 수정 버튼을 비활성화
            btnEdit.disabled = true;
            btnEdit.style.cursor = 'not-allowed';
        }
        btnEdit.addEventListener('click', () => editTodo(index));   // 수정 버튼을 클릭하면 할 일을 수정할 수 있는 입력 요소로 변경

        const btnDelete = document.createElement('button');
        // btnDelete.innerHTML = '<span class="material-symbols-outlined">delete</span>';
        btnDelete.textContent = '삭제';
        btnDelete.addEventListener('click', () => deleteTodo(index));   // 삭제 버튼을 클릭하면 할 일을 삭제

        // list의 할 일에 추가할 요소들을 추가
        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(alarm);
        li.appendChild(tag);
        li.appendChild(btnEdit);
        li.appendChild(btnDelete);
        li.dataset.index = index;   // li 요소에 index 값을 저장 data-index="index"

        return li;
    };

    const renderTodos = () => { // 리스트에 할 일 출력
        // listTodo.innerHTML = '';
        listTodo.textContent = ''; // 리스트 초기화 
        todos.forEach((todo, index) => { // 로컬 스토리지에 저장된 todos 배열을 순회하며 각 요소에 대해 createTodoElement 함수를 호출하여 li 요소를 생성하고 리스트에 추가
            listTodo.appendChild(createTodoElement(todo, index));
        });
        updateCounter();
    };

    const saveTodos = () => {   // todos 배열을 로컬 스토리지에 저장
        localStorage.setItem('todos', JSON.stringify(todos));   // keyName: todos / keyValue: todos 배열을 JSON 문자열로 변환하여 저장
    };

    const showError = (message) => {    // 입력 폼 유효성 검사 에러 메시지 출력
        msgError.textContent = message;
        setTimeout(() => msgError.textContent = '', 3000);  // 3초 후 에러 메시지를 초기화(안 보이게)하는 타이머 설정
    };

    const addTodo = (e) => {    // 입력 폼에 입력된 할 일을 todos 배열에 추가
        e.preventDefault(); // 기본 이벤트 동작을 중단
        const text = inputTodo.value.trim();    // 입력 폼에 입력된 문자열을 가져와서 앞뒤 공백을 제거
        const alarm = inputAlarm.value;
        const tags = inputTag.value.split(' ').filter(tag => tag.trim() !== '');    // 입력 폼에 입력된 태그들을 공백을 기준으로 나누고 앞뒤 공백을 제거

        if (text === '') {
            showError('할 일을 입력해주세요.');
            return; // 할 일이 입력되지 않은 경우 에러 메시지 출력 후 함수 종료(할 일이 입력되지 않은 경우 아래 코드를 실행하지 않도록. 즉 todos 배열에 추가하지 않도록)
        }

        if (alarm && new Date(alarm) < new Date()) {
            showError('알람 시간은 현재 시간보다 이후여야 합니다.');
            return;
        }

        if (tags.some(tag => tag.length > 10)) {    // 하나의 태그라도 10자를 넘긴 경우 에러 메시지 출력 후 함수 종료
            showError('태그는 10자를 넘길 수 없습니다.');
            return;
        }

        todos.push({    // todos 배열에 할 일을 추가
            text,   // 할 일 내용
            alarm,  // 알람 시간
            tags,   // 태그
            completed: false,   // 할 일이 완료되었는지 여부를 나타내는 completed 속성 추가, 초기값은 false
            alerted: false  // 알람이 울렸는지 여부를 나타내는 alerted 속성 추가, 초기값은 false
        });

        saveTodos();    // todos 배열을 로컬 스토리지에 저장
        renderTodos();  // 로컬 스토리지에 저장된 todos 배열을 리스트에 출력
        form.reset();   // 입력 폼 초기화
    };

    const toggleComplete = (index) => { // 할 일의 완료 여부를 토글 (완료된 경우 완료 취소, 완료되지 않은 경우 완료)
        todos[index].completed = !todos[index].completed;   // 할 일의 completed 속성을 토글 (true -> false, false -> true) 
        saveTodos();
        renderTodos();
    };

    const deleteTodo = (index) => { // 할 일 삭제 인덱스를 받아서 todos 배열에서 해당 인덱스의 요소를 삭제
        todos.splice(index, 1);    // splice 메서드를 사용해서 todos 배열에서 해당 인덱스의 요소를 삭제(삭제할 인덱스, 삭제할 요소 개수 = 1)
        saveTodos();
        renderTodos();
    };

    const editTodo = (index) => {   // todos 배열에서 해당 인덱스의 할 일을 수정할 수 있는 입력 폼으로 변경 
        if (todos[index].completed){   // 완료된 할 일은 수정할 수 없도록 함
            return;
        }

        // 수정 중인 할 일이 있을 때 다른 할 일을 수정할 수 없도록 입력 폼을 비활성화
        inputTodo.disabled = true;
        inputAlarm.disabled = true;
        inputTag.disabled = true;

        const li = listTodo.children[index];    // index에 해당하는 li 요소들(할 일 내용, 알람 시간, 태그, 수정, 삭제 버튼)을 가져옴
        const todo = todos[index];  // index에 해당하는 todos 배열의 요소를 가져옴

        //     li.innerHTML = `
        //     <input type="text" value="${todo.text}" id="editTodo">
        //     <input type="datetime-local" value="${todo.alarm ? new Date(todo.alarm).toISOString().slice(0, 16) : ''}" id="editAlarm">
        //     <input type="text" value="${todo.tags.join(' ')}" id="editTag" placeholder="태그(띄어쓰기 구분)">
        //     <div class="edit-buttons">
        //         <button id="btnSave">저장</button>
        //         <button id="btnCancel">취소</button>
        //     </div>
        // `;

        li.textContent = ''; // li 요소 초기화

        // 수정할 할 일 내용 텍스트 입력 요소 생성
        const editInputTodo = document.createElement('input');
        editInputTodo.type = 'text';
        editInputTodo.value = todo.text;
        editInputTodo.id = 'editTodo';

        // 수정할 알람 시간 입력 요소 생성
        const editInputAlarm = document.createElement('input');
        editInputAlarm.type = 'datetime-local';
        editInputAlarm.value = todo.alarm ? new Date(todo.alarm).toISOString().slice(0, 16) : '';   // Date 객체를 ISO 문자열로 변환 후 16자리까지 잘라서 출력 (예시: 2021-09-01T12:34)
        editInputAlarm.id = 'editAlarm';

        // 수정할 태그 입력 요소 생성
        const editInputTag = document.createElement('input');
        editInputTag.type = 'text';
        editInputTag.value = todo.tags.join(' ');
        editInputTag.id = 'editTag';
        editInputTag.placeholder = '태그(띄어쓰기 구분)';

        // 수정 버튼과 취소 버튼을 담을 div 요소 생성
        const editDivBtn = document.createElement('div');
        editDivBtn.className = 'edit-buttons';

        const btnSave = document.createElement('button');
        btnSave.textContent = '저장';
        btnSave.id = 'btnSave';

        const btnCancel = document.createElement('button');
        btnCancel.textContent = '취소';
        btnCancel.id = 'btnCancel';

        // 수정할 할 일 내용, 알람 시간, 태그, 수정/삭제 버튼을 li 요소에 추가
        editDivBtn.appendChild(btnSave);
        editDivBtn.appendChild(btnCancel);

        li.appendChild(editInputTodo);
        li.appendChild(editInputAlarm);
        li.appendChild(editInputTag);
        li.appendChild(editDivBtn);


        const editTodo = document.getElementById('editTodo');
        const editAlarm = document.getElementById('editAlarm');
        const editTag = document.getElementById('editTag');

        document.getElementById('btnSave').addEventListener('click', () => {    // 저장 버튼 클릭 시 할 일 수정

            const updatedText = editTodo.value.trim();
            const updatedAlarm = editAlarm.value;
            const updatedTags = editTag.value.split(' ').filter(tag => tag.trim() !== '');

            // 수정된 할 일이 잘못된 값일 경우 에러 메시지 출력
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

            // 수정된 할 일을 todos 배열에 반영
            todos[index] = {
                ...todos[index],    // 기존 할 일의 속성을 그대로 가져오고
                text: updatedText,
                alarm: updatedAlarm,
                tags: updatedTags
            };

            // todos 배열을 로컬 스토리지에 저장하고 리스트에 출력
            saveTodos();
            renderTodos();

            /** trouble shooting 
             * 수정 버튼 클릭시 수정된 할 일이 잘못된 값일 경우 입력 폼의 비활성화 상태가 풀리는 문제 해결
             * .disabled = false의 위치를 if 처리문(오류 메시지 출력) 아래로 이동
             * 모든 처리가 완료된 후 입력 폼의 비활성화 상태를 해제
            */
            inputTodo.disabled = false;
            inputAlarm.disabled = false;
            inputTag.disabled = false;
        });

        // document.getElementById('btnCancel').addEventListener('click', renderTodos);
        document.getElementById('btnCancel').addEventListener('click', function () { // 취소 버튼 클릭 시 할 일 수정 취소
            renderTodos();
            inputTodo.disabled = false;
            inputAlarm.disabled = false;
            inputTag.disabled = false;
        });
    };

    const checkAlarms = () => { // 설정한 알람 시간이 되었을 때 알람(alert) 표시
        const now = new Date().getTime();
        todos.forEach(todo => {
            if (todo.completed || todo.alerted) {   // 할 일이 완료되었거나 알람이 울린 경우에는 알람을 울리지 않음
                return;
            }

            if (todo.alarm && new Date(todo.alarm).getTime() <= now && !todo.alerted) {   // 알람 시간이 현재 시간보다 이전이고 알람이 울리지 않은 경우
                alert(`알람: ${todo.text}`);
                todo.alerted = true;    // 알람이 울렸음을 나타내는 alerted 속성을 true로 변경
                saveTodos();    // todos 배열을 로컬 스토리지에 저장
            }
        });
    };

    form.addEventListener('submit', addTodo);   // 입력 폼 제출 시 addTodo(입력 폼에 입력된 할 일을 todos 배열에 추가) 호출
    inputTodo.addEventListener('keydown', (e) => {  // 입력 폼에서 Enter 키 입력 시 addTodo(입력 폼에 입력된 할 일을 todos 배열에 추가) 호출
        if (e.key === 'Enter') {
            addTodo(e);
        }
    });

    let draggedIndex = null;    // 드래그 중인 요소의 인덱스를 저장. 드래그 중인 요소가 없으면 null(초기값)

    // 드래그 스타트 시 드래그 중인 요소의 인덱스를 저장하고 드래깅 클래스 추가
    // 드래그 스타트: 드래그가 시작될 때 발생하는 이벤트
    listTodo.addEventListener('dragstart', (e) => { 
        draggedIndex = e.target.dataset.index;
        e.target.classList.add('dragging');
    });

    // 드래그 엔드 시 드래그 중인 요소의 인덱스를 초기화하고 드래깅 클래스 제거
    // 드래그 엔드: 드래그가 끝날 때 발생하는 이벤트
    listTodo.addEventListener('dragend', (e) => {   
        e.target.classList.remove('dragging');
        draggedIndex = null;
    });

    // 드래그 오버 시 드래그 중인 요소를 마우스 위치에 따라 이동
    // 드래그 오버: 드래그 중인 요소가 다른 요소 위로 올라갈 때 발생하는 이벤트
    listTodo.addEventListener('dragover', (e) => {  
        e.preventDefault();
        const afterElement = getDragAfterElement(listTodo, e.clientY);  // 아래 함수 참조. 드래그 중인 요소가 다른 요소 위로 올라갈 때 그 요소의 위치를 반환
        const draggable = document.querySelector('.dragging');  // 드래그 중인 요소를 가져옴
        if (afterElement == null) { // 마우스 위치에 요소가 없으면 드래그 중인 요소를 리스트 마지막에 추가
            listTodo.appendChild(draggable);
        } else {    // 마우스 위치에 요소가 있으면 드래그 중인 요소를 그 요소 앞에 추가
            listTodo.insertBefore(draggable, afterElement);
        }
    });

    // 드롭 시 드래그 중인 요소의 인덱스를 저장하고 todos 배열을 재정렬
    // 드롭: 드래그 중인 요소를 다른 요소 위에 놓을 때 발생하는 이벤트
    listTodo.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetIndex = Array.from(listTodo.children).indexOf(e.target.closest('li'));  // 드롭된 요소의 인덱스를 가져옴
        if (draggedIndex !== null && targetIndex !== -1 && draggedIndex != targetIndex) {   // 드래그 중인 요소의 인덱스와 드롭된 요소의 인덱스가 같지 않은 경우
            const [movedItem] = todos.splice(draggedIndex, 1);  // todos 배열에서 드래그 중인 요소의 인덱스에 해당하는 요소를 삭제하고 삭제한 요소를 movedItem에 저장
            todos.splice(targetIndex, 0, movedItem);    // todos 배열에서 드롭된 요소의 인덱스에 해당하는 위치에 movedItem을 추가
            saveTodos();
            renderTodos();
        }
    });

    // 드래그 중인 요소가 다른 요소 위로 올라갈 때 그 요소의 위치를 반환
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('li:not(.dragging)')]; // container에서 드래그 중인 요소를 제외한 모든 li 요소를 가져옴

        return draggableElements.reduce((closest, child) => {   // reduce 메서드를 사용하여 드래그 중인 요소와 마우스 위치에 따라 가장 가까운 요소를 반환.
            const box = child.getBoundingClientRect();   // getBoundingClientRect 메서드를 사용하여 요소의 크기와 위치를 가져옴. getBoundingClientRect() 메서드는 child의 크기와 뷰포트에 상대적인 위치 정보를 제공하는 DOMRect 객체를 반환
            const offset = y - box.top - box.height / 2; // 드래그 중인 요소의 y 좌표와 child 요소의 y 좌표를 비교하여 드래그 중인 요소가 child 요소의 중간에 위치하면 offset은 0이 됨
            if (offset < 0 && offset > closest.offset) {    // offset이 0보다 작고 closest.offset보다 큰 경우(즉, 드래그 중인 요소가 child 요소의 중간에 위치하는 경우)
                return { offset: offset, element: child }; // offset과 child 요소를 반환
            } else {
                return closest; // 그렇지 않은 경우 closest를 반환
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;  // reduce 메서드의 초기값으로 offset을 음의 무한대로 설정. 이유: offset이 0보다 작은 경우에만 반환하도록 하기 위함
    }

    setInterval(checkAlarms, 1000); // 1초마다 checkAlarms 함수 호출하여 알람 시간이 되었는지 확인

    renderTodos();  // 페이지 로드 시 로컬 스토리지에 저장된 todos 배열을 리스트에 출력
});
