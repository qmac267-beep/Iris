import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// =========================================================
// 🔑 1. DÁN API KEY GEMINI CỦA BẠN VÀO ĐÂY
// =========================================================
const GEMINI_API_KEY = "AQ.Ab8RN6INYgu2UVbORLAI7Yc2sHB1FsktVe77oXgjebhFdk8toQ";

// Khởi tạo SDK Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Quản lý lịch sử trò chuyện (Giúp Iris thông minh, nhớ bối cảnh)
let chatHistory = [];

// =========================
// Scene Setup
// =========================

const container = document.getElementById("canvas-container");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1f1f28);

// =========================
// Camera
// =========================

const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.set(0, 1.25, 1.95);

// =========================
// Renderer
// =========================

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

container.appendChild(renderer.domElement);

// =========================
// Lighting System
// =========================

scene.add(new THREE.HemisphereLight(0xdbe9ff, 0x332244, 0.8));

const dirLight = new THREE.DirectionalLight(0xffe3ff, 1.1);
dirLight.position.set(1, 3, 2);
scene.add(dirLight);

const fill = new THREE.DirectionalLight(0xaaaaff, 0.4);
fill.position.set(-2, 2, 2);
scene.add(fill);

// =========================
// Variables & State
// =========================

const clock = new THREE.Clock();
let currentVrm = null;

// =========================
// VRM Loader
// =========================

const loader = new GLTFLoader();

loader.register((parser) => {
    return new VRMLoaderPlugin(parser);
});

loader.load(
    "./character.vrm",
    (gltf) => {
        const vrm = gltf.userData.vrm;

        if (!vrm) {
            console.error("Không tìm thấy VRM");
            return;
        }

        VRMUtils.rotateVRM0(vrm);

        vrm.scene.rotation.y = Math.PI;
        vrm.scene.position.set(0, 0.6, -1);

        scene.add(vrm.scene);
        currentVrm = vrm;

        console.log("Iris Loaded Successfully!");
    },
    (xhr) => {
        if (xhr.total) {
            console.log(Math.floor((xhr.loaded / xhr.total) * 100) + "%");
        }
    },
    (err) => {
        console.error(err);
    }
);

const lookTarget = new THREE.Vector3(0, 1.15, 0);

// =========================
// Mouse Look
// =========================

const mouse = new THREE.Vector2(0, 0);

window.addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// =========================
// Blink & LookAt Systems
// =========================

let blinkTimer = 0;
let blinkValue = 0;

function updateBlink(delta) {
    blinkTimer += delta;

    if (blinkTimer > 3 + Math.random() * 2) {
        blinkValue = 1;
        blinkTimer = 0;
    }

    blinkValue = THREE.MathUtils.lerp(blinkValue, 0, delta * 12);

    if (currentVrm?.expressionManager) {
        try {
            currentVrm.expressionManager.setValue("blink", blinkValue);
            currentVrm.expressionManager.update();
        } catch (e) {}
    }
}

function updateLookAt(delta) {
    if (!currentVrm) return;

    const neck = currentVrm.humanoid?.getNormalizedBoneNode("neck");
    const head = currentVrm.humanoid?.getNormalizedBoneNode("head");

    if (!neck) return;

    const targetX = mouse.x * 0.35;
    const targetY = mouse.y * 0.18;

    neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, targetX, delta * 4);
    neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, targetY, delta * 4);

    if (head) {
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, targetX * 0.2, delta * 4);
    }
}

// =========================
// Idle Animation: Nhún nhảy nhẹ nhàng + Khép sát 2 tay
// =========================

function updateIdle(time, delta) {
    if (!currentVrm) return;

    const body = currentVrm.humanoid?.getNormalizedBoneNode("hips");
    const spine = currentVrm.humanoid?.getNormalizedBoneNode("spine");
    const head = currentVrm.humanoid?.getNormalizedBoneNode("head");

    if (body) {
        body.position.y = Math.sin(time * 3.5) * 0.025;
        body.rotation.z = Math.sin(time * 1.8) * 0.015;
    }

    if (spine) {
        spine.rotation.x = Math.sin(time * 3.5) * 0.02;
    }

    if (head) {
        head.rotation.z = Math.sin(time * 2.5) * 0.02;
    }

    const leftUpperArm = currentVrm.humanoid?.getRawBoneNode("leftUpperArm");
    const rightUpperArm = currentVrm.humanoid?.getRawBoneNode("rightUpperArm");
    const leftLowerArm = currentVrm.humanoid?.getRawBoneNode("leftLowerArm");
    const rightLowerArm = currentVrm.humanoid?.getRawBoneNode("rightLowerArm");

    if (leftUpperArm) {
        leftUpperArm.rotation.x = 0.05;
        leftUpperArm.rotation.y = 0;
        leftUpperArm.rotation.z = 1.35 + Math.sin(time * 3.5) * 0.02;
    }
    if (rightUpperArm) {
        rightUpperArm.rotation.x = 0.05;
        rightUpperArm.rotation.y = 0;
        rightUpperArm.rotation.z = -1.35 - Math.sin(time * 3.5) * 0.02;
    }

    if (leftLowerArm) {
        leftLowerArm.rotation.x = 0.1;
        leftLowerArm.rotation.z = 0;
    }
    if (rightLowerArm) {
        rightLowerArm.rotation.x = 0.1;
        rightLowerArm.rotation.z = 0;
    }
}

// =========================
// Main Loop
// =========================

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.elapsedTime;

    if (currentVrm) {
        currentVrm.update(delta);

        updateIdle(time, delta);
        updateBlink(delta);
        updateLookAt(delta);
    }

    camera.lookAt(lookTarget);
    renderer.render(scene, camera);
}

animate();

// =========================
// Resize Event
// =========================

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// =========================================
// EXPRESSION & MOUTH CONTROL (Gương mặt thông minh)
// =========================================

function setExpression(name) {
    if (!currentVrm?.expressionManager) return;

    const em = currentVrm.expressionManager;
    const list = ["happy", "sad", "angry", "surprised", "relaxed"];

    list.forEach((exp) => {
        try { em.setValue(exp, 0); } catch (e) {}
    });

    try {
        em.setValue(name, 1);
        em.update();
    } catch (e) {}

    setTimeout(() => {
        list.forEach((exp) => {
            try { em.setValue(exp, 0); } catch (e) {}
        });
        try { em.update(); } catch (e) {}
    }, 4000);
}

// Tự động chọn biểu cảm dựa trên cảm xúc văn bản
function detectEmotionAndSet(text) {
    const lower = text.toLowerCase();
    if (lower.includes("buồn") || lower.includes("tiếc") || lower.includes("xin lỗi")) {
        setExpression("sad");
    } else if (lower.includes("ồ") || lower.includes("thật sao") || lower.includes("bất ngờ")) {
        setExpression("surprised");
    } else if (lower.includes("giận") || lower.includes("ghét")) {
        setExpression("angry");
    } else {
        setExpression("happy");
    }
}

// Giả lập cử động khuôn miệng khi nói
function simulateLipSync(textLength) {
    if (!currentVrm?.expressionManager) return;
    const em = currentVrm.expressionManager;
    const vowels = ["aa", "ih", "ou"];

    let duration = Math.min(textLength * 130, 7000);
    let interval = setInterval(() => {
        vowels.forEach((v) => em.setValue(v, 0));
        const randomVowel = vowels[Math.floor(Math.random() * vowels.length)];
        em.setValue(randomVowel, 0.6 + Math.random() * 0.4);
        em.update();
    }, 110);

    setTimeout(() => {
        clearInterval(interval);
        vowels.forEach((v) => em.setValue(v, 0));
        em.update();
    }, duration);
}

// =========================================================
// GEMINI AI SMART ENGINE (Tự động khắc phục mọi loại lỗi)
// =========================================================

async function fetchGeminiResponse(userMessage) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes("DÁN_MÃ_API_KEY")) {
        return "Bạn chưa dán API Key vào file main.js kìa!";
    }

    const systemPrompt = "Bạn tên là Iris, một trợ lý AI 3D siêu đáng yêu, thông minh và thân thiện. Bạn hãy trả lời tự nhiên, ngắn gọn (1-3 câu), xưng 'Iris' và gọi người dùng là 'bạn'. Không dùng ký tự Markdown như ** hoặc #.";

    // Danh sách các model fallback dự phòng theo thứ tự từ mới tới cũ
    const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

    // 1. Thử gọi từng model thông qua SDK
    for (const modelName of candidateModels) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemPrompt
            });

            // Gửi tin nhắn kèm trí nhớ câu thoại cũ
            const chat = model.startChat({
                history: chatHistory
            });

            const result = await chat.sendMessage(userMessage);
            const response = await result.response;
            let text = response.text();

            // Cập nhật bộ nhớ trò chuyện
            chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
            chatHistory.push({ role: "model", parts: [{ text: text }] });

            // Giới hạn lịch sử lưu tối đa 10 câu gần nhất cho nhẹ
            if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);

            return text.replace(/[*#]/g, ""); // Dọn dẹp ký tự Markdown
        } catch (e) {
            console.warn(`Model ${modelName} bị lỗi, đang tự động chuyển model tiếp theo...`, e);
        }
    }

    // 2. Nếu tất cả SDK model thất bại, sử dụng fallback REST API direct
    try {
        const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        const directRes = await fetch(directUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt + "\n\nNgười dùng: " + userMessage }] }]
            })
        });
        const data = await directRes.json();
        return data.candidates[0].content.parts[0].text.replace(/[*#]/g, "");
    } catch (err) {
        console.error("Tất cả các kết nối AI đều lỗi:", err);
        return "Iris đang bị gián đoạn mạng một chút, bạn chờ Iris vài giây rồi nhắn lại nha!";
    }
}

// ========================================
// Chat Logic & Bắt sự kiện
// ========================================

async function askIris() {
    const input = document.getElementById("user-input");
    const chat = document.getElementById("chat-box");
    const text = input.value.trim();

    if (text === "") return;

    // 1. Hiển thị tin nhắn người dùng
    chat.innerHTML += `<br><b>Bạn:</b> ${text}`;
    chat.scrollTop = chat.scrollHeight;
    input.value = "";

    // Hiển thị trạng thái đang suy nghĩ
    const loadingId = "loading-" + Date.now();
    chat.innerHTML += `<br><span id="${loadingId}" style="color:#aaa"><i>Iris đang suy nghĩ...</i></span>`;
    chat.scrollTop = chat.scrollHeight;

    // 2. Gọi Gemini AI siêu thông minh
    const aiReply = await fetchGeminiResponse(text);

    // Xóa dòng "đang suy nghĩ"
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    // 3. Hiển thị câu trả lời của Iris
    chat.innerHTML += `<br><span style="color:#ffb8ff"><b>Iris:</b> ${aiReply}</span>`;
    chat.scrollTop = chat.scrollHeight;

    // 4. Cho nhân vật 3D biểu cảm & nhép miệng thông minh
    detectEmotionAndSet(aiReply);
    simulateLipSync(aiReply.length);
}

document.getElementById("send-btn").addEventListener("click", askIris);

document.getElementById("user-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") askIris();
});

// ===========================================
// Voice Recognition (Microphone)
// ===========================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        document.getElementById("user-input").value = text;
        askIris();
    };
}

const micBtn = document.createElement("button");
micBtn.innerHTML = "🎤";
micBtn.style.position = "absolute";
micBtn.style.right = "20px";
micBtn.style.bottom = "20px";
micBtn.style.width = "60px";
micBtn.style.height = "60px";
micBtn.style.borderRadius = "50%";
micBtn.style.fontSize = "30px";
micBtn.style.cursor = "pointer";

document.body.appendChild(micBtn);

micBtn.onclick = () => {
    if (recognition) {
        recognition.start();
    }
};
