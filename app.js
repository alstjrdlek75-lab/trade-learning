document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 선택
    const modeToggleBtn = document.getElementById('mode-toggle-btn');
    const labelStudent = document.getElementById('label-student');
    const labelTeacher = document.getElementById('label-teacher');
    const gradeBtn = document.getElementById('grade-btn');
    const resetBtn = document.getElementById('reset-btn');
    const printBtn = document.getElementById('print-btn');
    const currentScoreSpan = document.getElementById('current-score');
    const scorePercentageSpan = document.getElementById('score-percentage');
    const scoreBar = document.getElementById('score-bar');
    
    // 채점 대상 입력 요소들 추출 (select 포함)
    const textInputs = document.querySelectorAll('input[data-answer], select[data-answer]');
    const textareas = document.querySelectorAll('textarea[data-answer-keyword]');
    const totalQuestions = textInputs.length + textareas.length;
    
    // 초기 스코어 분모 세팅
    currentScoreSpan.textContent = `0 / ${totalQuestions}`;
    scorePercentageSpan.textContent = `(0%)`;

    // ==========================================
    // 1. 모드 전환 제어 (학생용 vs 정답 모드)
    // ==========================================
    let isTeacherMode = false;
    const teacherGuideSection = document.getElementById('teacher-guide');

    function updateModeUI() {
        if (isTeacherMode) {
            document.body.classList.add('teacher-mode');
            labelStudent.classList.remove('active');
            labelTeacher.classList.add('active');
            scoreBar.style.display = 'none'; // 정답 모드에서는 채점 바 숨김
        } else {
            document.body.classList.remove('teacher-mode');
            labelStudent.classList.add('active');
            labelTeacher.classList.remove('active');
            scoreBar.style.display = 'block'; // 학생용 모드에서는 채점 바 노출
        }
    }

    function toggleMode() {
        isTeacherMode = !isTeacherMode;
        updateModeUI();

        // 정답 모드 활성화 시 해설 섹션으로 자동 부드러운 스크롤
        if (isTeacherMode && teacherGuideSection) {
            setTimeout(() => {
                teacherGuideSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }

    modeToggleBtn.addEventListener('click', toggleMode);
    
    // 모드 텍스트 클릭 시에도 전환 가능하도록 지원
    labelStudent.addEventListener('click', () => {
        if (isTeacherMode) {
            isTeacherMode = false;
            updateModeUI();
        }
    });
    labelTeacher.addEventListener('click', () => {
        if (!isTeacherMode) {
            isTeacherMode = true;
            updateModeUI();
            
            // 정답 모드 활성화 시 해설 섹션으로 자동 부드러운 스크롤
            if (teacherGuideSection) {
                setTimeout(() => {
                    teacherGuideSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        }
    });

    // ==========================================
    // 2. 채점 시스템 로직
    // ==========================================
    function cleanText(text) {
        // 공백 제거, 소문자 변환, 특수기호 및 괄호 일부 정리
        return text.trim().replace(/\s+/g, '').toLowerCase();
    }

    function checkAnswer(inputEl) {
        const userAnswer = cleanText(inputEl.value);
        const rawAnswers = inputEl.getAttribute('data-answer');
        if (!rawAnswers) return false;
        
        const possibleAnswers = rawAnswers.split('|').map(ans => cleanText(ans));
        
        return possibleAnswers.includes(userAnswer);
    }

    function checkTextarea(textareaEl) {
        const userContent = textareaEl.value.trim();
        if (userContent.length === 0) return false;
        
        const rawKeywords = textareaEl.getAttribute('data-answer-keyword');
        if (!rawKeywords) return true; // 키워드 검증 대상이 아니면 내용이 채워져만 있어도 맞음 처리
        
        const keywords = rawKeywords.split('|');
        // 설정된 핵심 키워드 중 하나 이상이 포함되어 있는지 검사
        return keywords.some(keyword => userContent.includes(keyword.trim()));
    }

    function removeFeedback(el) {
        el.classList.remove('correct', 'incorrect');
        const existingIcon = el.parentNode.querySelector('.feedback-icon');
        if (existingIcon) {
            existingIcon.remove();
        }
    }

    function addFeedbackIcon(parentEl, isCorrect) {
        // 기존 아이콘이 있으면 제거
        const existingIcon = parentEl.querySelector('.feedback-icon');
        if (existingIcon) existingIcon.remove();

        const icon = document.createElement('span');
        icon.className = `feedback-icon ${isCorrect ? 'correct' : 'incorrect'}`;
        icon.innerHTML = isCorrect 
            ? '<i class="fa-solid fa-circle-check"></i>' 
            : '<i class="fa-solid fa-circle-xmark" title="다시 풀어보세요!"></i>';
        parentEl.appendChild(icon);
    }

    const scoreInfo = document.getElementById('score-info');
    const resultModal = document.getElementById('result-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalStudentInfo = document.getElementById('modal-student-info');
    const modalScoreText = document.getElementById('modal-score-text');
    const modalPercentText = document.getElementById('modal-percent-text');
    const modalFeedbackText = document.getElementById('modal-feedback-text');
    const modalIcon = document.getElementById('modal-icon');

    function performGrading() {
        let correctCount = 0;

        // 1. 단답형 단어/숫자 입력창 채점
        textInputs.forEach(input => {
            removeFeedback(input);
            if (input.value.trim() === '') {
                input.classList.add('incorrect');
                addFeedbackIcon(input.parentNode, false);
                return;
            }

            const isCorrect = checkAnswer(input);
            if (isCorrect) {
                input.classList.add('correct');
                correctCount++;
                addFeedbackIcon(input.parentNode, true);
            } else {
                input.classList.add('incorrect');
                addFeedbackIcon(input.parentNode, false);
            }
        });

        // 2. 서술형 풀이창 채점 (핵심 키워드 포함 검사)
        textareas.forEach(textarea => {
            removeFeedback(textarea);
            if (textarea.value.trim() === '') {
                textarea.classList.add('incorrect');
                addFeedbackIcon(textarea.parentNode, false);
                return;
            }

            const isCorrect = checkTextarea(textarea);
            if (isCorrect) {
                textarea.classList.add('correct');
                correctCount++;
                addFeedbackIcon(textarea.parentNode, true);
            } else {
                textarea.classList.add('incorrect');
                addFeedbackIcon(textarea.parentNode, false);
            }
        });

        // 점수 갱신
        currentScoreSpan.textContent = `${correctCount} / ${totalQuestions}`;
        const percentage = Math.round((correctCount / totalQuestions) * 100);
        scorePercentageSpan.textContent = `(${percentage}%)`;

        // 플로팅 바 점수 노출
        if (scoreInfo) {
            scoreInfo.style.display = 'flex';
        }

        // 학적 정보 취득 및 포맷팅
        const infoFields = document.querySelectorAll('.underline-field');
        function getCleanInfo(text, defaultVal) {
            const clean = text.replace(/　/g, '').trim();
            return clean === '' ? defaultVal : clean;
        }
        const grade = infoFields[0] ? getCleanInfo(infoFields[0].textContent, '-') : '-';
        const classNum = infoFields[1] ? getCleanInfo(infoFields[1].textContent, '-') : '-';
        const number = infoFields[2] ? getCleanInfo(infoFields[2].textContent, '-') : '-';
        const name = infoFields[3] ? getCleanInfo(infoFields[3].textContent, '미입력') : '미입력';

        if (modalStudentInfo) {
            modalStudentInfo.textContent = `${grade}학년 ${classNum}반 ${number}번 - 이름: ${name}`;
        }
        if (modalScoreText) {
            modalScoreText.textContent = `${correctCount} / ${totalQuestions}`;
        }
        if (modalPercentText) {
            modalPercentText.textContent = `(${percentage}%)`;
        }

        // 점수대별 피드백 메시지 설정
        let feedbackMsg = "";
        let iconClass = "fa-trophy";
        
        if (percentage === 100) {
            feedbackMsg = "🏆 만점입니다! 국제 무역의 원리(절대우위, 비교우위, 기회비용, 교역조건)를 완벽하게 이해하셨습니다!";
            iconClass = "fa-trophy";
            triggerConfetti();
        } else if (percentage >= 80) {
            feedbackMsg = "👍 아주 훌륭합니다! 무역과 기회비용의 핵심 원리를 성공적으로 습득하셨습니다.";
            iconClass = "fa-star";
        } else if (percentage >= 50) {
            feedbackMsg = "✍️ 조금 더 노력하면 완벽해질 수 있어요! 헷갈리는 부분은 하단의 정답 및 해설을 참고하여 내 답안을 검토해 보세요.";
            iconClass = "fa-pen-to-square";
        } else {
            feedbackMsg = "📚 기본 개념을 교과서와 정답 해설을 통해 다시 학습한 뒤, 다시 한 번 제출에 도전해 보세요!";
            iconClass = "fa-book-open";
        }

        if (modalFeedbackText) {
            modalFeedbackText.textContent = feedbackMsg;
        }
        if (modalIcon) {
            modalIcon.className = `fa-solid ${iconClass} trophy-icon`;
        }

        // 결과 모달창 노출
        if (resultModal) {
            resultModal.style.display = 'flex';
        }

        // 버튼 텍스트 변경
        if (gradeBtn) {
            gradeBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> 답안 다시 채점하기';
        }
    }

    if (gradeBtn) {
        gradeBtn.addEventListener('click', performGrading);
    }

    if (modalCloseBtn && resultModal) {
        modalCloseBtn.addEventListener('click', () => {
            resultModal.style.display = 'none';
        });
    }

    // ==========================================
    // 3. 초기화 및 생산가능곡선(PPF) 연동 로직
    // ==========================================
    const svg = document.getElementById('ppf-svg');
    const inputAY = document.getElementById('input-a-y');
    const inputAX = document.getElementById('input-a-x');
    const inputBY = document.getElementById('input-b-y');
    const inputBX = document.getElementById('input-b-x');

    const lineA = document.getElementById('line-country-a');
    const lineB = document.getElementById('line-country-b');

    const handleAY = document.getElementById('handle-a-y');
    const handleAX = document.getElementById('handle-a-x');
    const handleBY = document.getElementById('handle-b-y');
    const handleBX = document.getElementById('handle-b-x');

    const MIN_VAL = 0;
    const MAX_VAL = 50;
    const ORIGIN_X = 40;
    const ORIGIN_Y = 400;
    const SCALE = 7.2;
    const SNAP_INTERVAL = 5;

    let state = {
        a: { x: 0, y: 0 },
        b: { x: 0, y: 0 }
    };

    function valToPxX(val) {
        return ORIGIN_X + val * SCALE;
    }

    function valToPxY(val) {
        return ORIGIN_Y - val * SCALE;
    }

    function pxToValX(px) {
        const raw = (px - ORIGIN_X) / SCALE;
        return Math.max(MIN_VAL, Math.min(MAX_VAL, raw));
    }

    function pxToValY(px) {
        const raw = (ORIGIN_Y - px) / SCALE;
        return Math.max(MIN_VAL, Math.min(MAX_VAL, raw));
    }

    function snap(val) {
        return Math.round(val / SNAP_INTERVAL) * SNAP_INTERVAL;
    }

    function updatePPFVisuals() {
        const axPx = valToPxX(state.a.x);
        const ayPx = valToPxY(state.a.y);
        
        if (lineA) {
            lineA.setAttribute('x1', ORIGIN_X);
            lineA.setAttribute('y1', ayPx);
            lineA.setAttribute('x2', axPx);
            lineA.setAttribute('y2', ORIGIN_Y);
        }

        if (handleAY) {
            handleAY.setAttribute('cx', ORIGIN_X);
            handleAY.setAttribute('cy', ayPx);
        }
        if (handleAX) {
            handleAX.setAttribute('cx', axPx);
            handleAX.setAttribute('cy', ORIGIN_Y);
        }

        if (inputAY) inputAY.value = state.a.y;
        if (inputAX) inputAX.value = state.a.x;

        const bxPx = valToPxX(state.b.x);
        const byPx = valToPxY(state.b.y);

        if (lineB) {
            lineB.setAttribute('x1', ORIGIN_X);
            lineB.setAttribute('y1', byPx);
            lineB.setAttribute('x2', bxPx);
            lineB.setAttribute('y2', ORIGIN_Y);
        }

        if (handleBY) {
            handleBY.setAttribute('cx', ORIGIN_X);
            handleBY.setAttribute('cy', byPx);
        }
        if (handleBX) {
            handleBX.setAttribute('cx', bxPx);
            handleBX.setAttribute('cy', ORIGIN_Y);
        }

        if (inputBY) inputBY.value = state.b.y;
        if (inputBX) inputBX.value = state.b.x;
    }

    function handleInputChange() {
        state.a.y = Math.max(MIN_VAL, Math.min(MAX_VAL, snap(Number(inputAY.value) || 0)));
        state.a.x = Math.max(MIN_VAL, Math.min(MAX_VAL, snap(Number(inputAX.value) || 0)));
        state.b.y = Math.max(MIN_VAL, Math.min(MAX_VAL, snap(Number(inputBY.value) || 0)));
        state.b.x = Math.max(MIN_VAL, Math.min(MAX_VAL, snap(Number(inputBX.value) || 0)));
        updatePPFVisuals();
    }

    if (inputAY) {
        inputAY.addEventListener('change', handleInputChange);
        inputAX.addEventListener('change', handleInputChange);
        inputBY.addEventListener('change', handleInputChange);
        inputBX.addEventListener('change', handleInputChange);
    }

    let activeDrag = null;

    function getSVGCoordinates(e) {
        if (!svg) return { x: 0, y: 0 };
        const rect = svg.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const svgX = ((clientX - rect.left) / rect.width) * 450;
        const svgY = ((clientY - rect.top) / rect.height) * 450;
        return { x: svgX, y: svgY };
    }

    function initDrag(handleEl, country, axis) {
        return function(e) {
            e.preventDefault();
            activeDrag = { handle: handleEl, country, axis };
            handleEl.classList.add('active');
        };
    }

    if (handleAY) {
        handleAY.addEventListener('mousedown', initDrag(handleAY, 'a', 'y'));
        handleAY.addEventListener('touchstart', initDrag(handleAY, 'a', 'y'), { passive: false });
        
        handleAX.addEventListener('mousedown', initDrag(handleAX, 'a', 'x'));
        handleAX.addEventListener('touchstart', initDrag(handleAX, 'a', 'x'), { passive: false });

        handleBY.addEventListener('mousedown', initDrag(handleBY, 'b', 'y'));
        handleBY.addEventListener('touchstart', initDrag(handleBY, 'b', 'y'), { passive: false });

        handleBX.addEventListener('mousedown', initDrag(handleBX, 'b', 'x'));
        handleBX.addEventListener('touchstart', initDrag(handleBX, 'b', 'x'), { passive: false });
    }

    window.addEventListener('mousemove', (e) => {
        if (!activeDrag) return;
        const coords = getSVGCoordinates(e);
        if (activeDrag.axis === 'x') {
            const rawVal = pxToValX(coords.x);
            state[activeDrag.country].x = snap(rawVal);
        } else {
            const rawVal = pxToValY(coords.y);
            state[activeDrag.country].y = snap(rawVal);
        }
        updatePPFVisuals();
    });

    window.addEventListener('touchmove', (e) => {
        if (!activeDrag) return;
        const coords = getSVGCoordinates(e);
        if (activeDrag.axis === 'x') {
            const rawVal = pxToValX(coords.x);
            state[activeDrag.country].x = snap(rawVal);
        } else {
            const rawVal = pxToValY(coords.y);
            state[activeDrag.country].y = snap(rawVal);
        }
        updatePPFVisuals();
    }, { passive: false });

    function endDrag() {
        if (activeDrag) {
            activeDrag.handle.classList.remove('active');
            activeDrag = null;
        }
    }

    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
    window.addEventListener('touchcancel', endDrag);

    // 초기 시각화 적용
    updatePPFVisuals();

    // ==========================================
    // 3. 초기화 시스템 로직
    // ==========================================
    resetBtn.addEventListener('click', () => {
        if (confirm('작성한 모든 답안을 초기화하시겠습니까?')) {
            // 모든 텍스트형 입력 청소
            textInputs.forEach(input => {
                input.value = '';
                removeFeedback(input);
            });
            textareas.forEach(textarea => {
                textarea.value = '';
                removeFeedback(textarea);
            });

            // 학적 정보칸 밑줄의 텍스트도 비우기 (일부는 선택사항이므로 초기화만 진행)
            document.querySelectorAll('.underline-field').forEach(field => {
                field.innerHTML = '　　';
            });

            // PPF 차트 상태 리셋
            state.a.x = 0;
            state.a.y = 0;
            state.b.x = 0;
            state.b.y = 0;
            updatePPFVisuals();

            // 스코어 및 제출 바 상태 리셋
            currentScoreSpan.textContent = `0 / ${totalQuestions}`;
            scorePercentageSpan.textContent = `(0%)`;
            
            if (scoreInfo) {
                scoreInfo.style.display = 'none';
            }
            if (gradeBtn) {
                gradeBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 활동지 제출 및 채점하기';
            }
        }
    });

    // ==========================================
    // 4. 인쇄하기 연동
    // ==========================================
    printBtn.addEventListener('click', () => {
        window.print();
    });

    // ==========================================
    // 5. 순수 자바스크립트 Confetti 효과
    // ==========================================
    function triggerConfetti() {
        const canvas = document.getElementById('confetti-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // 리사이즈 대응
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });

        const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
        const particles = [];
        
        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                r: Math.random() * 6 + 4,
                d: Math.random() * canvas.height,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.random() * 10 - 5,
                tiltAngleIncremental: Math.random() * 0.07 + 0.02,
                tiltAngle: 0
            });
        }

        let animationFrameId;

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = false;

            particles.forEach((p, index) => {
                p.tiltAngle += p.tiltAngleIncremental;
                p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
                p.x += Math.sin(p.tiltAngle);
                p.tilt = Math.sin(p.tiltAngle - index / 3) * 15;

                if (p.y <= canvas.height) {
                    active = true;
                }

                ctx.beginPath();
                ctx.lineWidth = p.r;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
                ctx.stroke();
            });

            if (active) {
                animationFrameId = requestAnimationFrame(draw);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }

        draw();

        // 4초 뒤 애니메이션 정지 및 캔버스 클리어
        setTimeout(() => {
            cancelAnimationFrame(animationFrameId);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }, 4000);
    }
});
