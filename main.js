import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
    VRMLoaderPlugin,
    VRMUtils
} from "@pixiv/three-vrm";

// =========================
// Scene
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

camera.position.set(0, 1.35, 2.2);

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
// Light
// =========================

scene.add(new THREE.HemisphereLight(
    0xffffff,
    0x555555,
    1.4
));

const dirLight = new THREE.DirectionalLight(
    0xffffff,
    2
);

dirLight.position.set(1,3,2);

scene.add(dirLight);

const fill = new THREE.DirectionalLight(
    0xaaaaff,
    0.6
);

fill.position.set(-2,2,2);

scene.add(fill);

// =========================
// Clock
// =========================

const clock = new THREE.Clock();

let currentVrm = null;

// =========================
// Loader
// =========================

const loader = new GLTFLoader();

loader.register((parser)=>{

    return new VRMLoaderPlugin(parser);

});

// =========================
// Load Iris
// =========================

loader.load(

"/character.vrm",

(gltf)=>{

    const vrm = gltf.userData.vrm;

    if(!vrm){

        console.error("Không tìm thấy VRM");

        return;

    }

    VRMUtils.rotateVRM0(vrm);

    vrm.scene.rotation.y=Math.PI;

    vrm.scene.position.set(0,0.8,-1.5);

    scene.add(vrm.scene);

    currentVrm=vrm;

    console.log("Iris Loaded!");

},

(xhr)=>{

    if(xhr.total){

        console.log(
            Math.floor(xhr.loaded/xhr.total*100)+"%"
        );

    }

},

(err)=>{

    console.error(err);

}

);

const lookTarget = new THREE.Vector3(
    0,
    1.15,
    0
);
// =========================
// Mouse Look
// =========================

const mouse = new THREE.Vector2(0, 0);

window.addEventListener("mousemove", (e) => {

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

});

// =========================
// Idle Animation
// =========================

let blinkTimer = 0;
let blinkValue = 0;

function updateBlink(delta) {

    blinkTimer += delta;

    if (blinkTimer > 3 + Math.random() * 2) {

        blinkValue = 1;
        blinkTimer = 0;

    }

    blinkValue = THREE.MathUtils.lerp(
        blinkValue,
        0,
        delta * 12
    );

    if (currentVrm?.expressionManager) {

        try {

            currentVrm.expressionManager.setValue(
                "blink",
                blinkValue
            );

            currentVrm.expressionManager.update();

        } catch (e) {}

    }

}

// =========================
// Head Look
// =========================

function updateLookAt(delta) {

    if (!currentVrm) return;

    const neck =
        currentVrm.humanoid?.getNormalizedBoneNode("neck");

    if (!neck) return;

    const targetX = mouse.x * 0.35;
    const targetY = mouse.y * 0.18;

    neck.rotation.y = THREE.MathUtils.lerp(

        neck.rotation.y,
        targetX,
        delta * 4

    );

    neck.rotation.x = THREE.MathUtils.lerp(

        neck.rotation.x,
        targetY,
        delta * 4

    );

}

// =========================
// Breathing & Stand Animation (A-Pose)
// =========================

function updateIdle(time) {

    if (!currentVrm) return;

    const body =
        currentVrm.humanoid?.getNormalizedBoneNode("hips");

    if (!body) return;

    // Chuyển động nhấp nhô của cơ thể khi thở
    body.position.y =
        Math.sin(time * 2) * 0.01;

    body.rotation.z =
        Math.sin(time * 1.3) * 0.015;

    // --- CẬP NHẬT LIÊN TỤC GÓC XOAY ĐỂ HẠ TAY XUỐNG (A-POSE) VÀ THỞ ---
    const leftUpperArm = currentVrm.humanoid?.getRawBoneNode('leftUpperArm');
    const rightUpperArm = currentVrm.humanoid?.getRawBoneNode('rightUpperArm');
    const leftShoulder = currentVrm.humanoid?.getRawBoneNode('leftShoulder');
    const rightShoulder = currentVrm.humanoid?.getRawBoneNode('rightShoulder');

    // Khép hai bả vai vào một chút và tạo chuyển động thở nhẹ ở vai
    if (leftShoulder) {
        leftShoulder.rotation.z = Math.PI / 18;
        leftShoulder.rotation.x = Math.sin(time * 2) * 0.015;
    }
    if (rightShoulder) {
        rightShoulder.rotation.z = -Math.PI / 18;
        rightShoulder.rotation.x = Math.sin(time * 2) * 0.015;
    }

    // Hạ hai cánh tay xuôi xuống góc ~60 độ (Tránh bị giật T-pose ngược lại)
    if (leftUpperArm) {
        leftUpperArm.rotation.z = Math.PI / 3.2;
    }
    if (rightUpperArm) {
        rightUpperArm.rotation.z = -Math.PI / 3.2;
    }
    // -------------------------------------------------------------

}

// =========================
// Animate
// =========================

function animate() {

    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    const time = clock.elapsedTime;

    if (currentVrm) {

        // Hàm update này khôi phục T-Pose mặc định từ file
        currentVrm.update(delta);

        // Do đó ta chạy updateIdle ngay sau để ép xương theo dáng A-Pose mong muốn
        updateIdle(time);

        updateBlink(delta);

        updateLookAt(delta);

    }

    camera.lookAt(lookTarget);

    renderer.render(scene, camera);

}

animate();

// =========================
// Resize
// =========================

window.addEventListener("resize", () => {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(

        window.innerWidth,

        window.innerHeight

    );

});
// ========================================
// IRIS AI CHAT
// ========================================

const irisBrain = [

{
keywords:["hi","hello","chao","xin chao"],
expression:"happy",
responses:[
"Xin chào! Mình là Iris 💜",
"Chào bạn! Hôm nay bạn khỏe không?",
"Rất vui được gặp bạn!"
]
},

{
keywords:["ten","la ai","ai"],
expression:"happy",
responses:[
"Mình là Iris, trợ lý AI 3D của bạn.",
"Bạn có thể gọi mình là Iris nha 💜"
]
},

{
keywords:["cam on","thank"],
expression:"happy",
responses:[
"Không có gì đâu 🥰",
"Rất vui được giúp bạn!"
]
},

{
keywords:["tam biet","bye","goodbye"],
expression:"sad",
responses:[
"Tạm biệt nhé!",
"Hẹn gặp lại bạn ❤️"
]
},

{
keywords:["dep","cute","xinh"],

expression:"happy",

responses:[
"Hihi ngại quá 🥰",
"Cảm ơn bạn nhiều!"
]

},

{

keywords:["buon","stress","met"],

expression:"sad",

responses:[
"Mọi chuyện rồi sẽ ổn thôi.",
"Iris luôn ở đây nghe bạn tâm sự.",
"Cố lên nhé ❤️"
]

},

{

keywords:["ghet","ngu","xau"],

expression:"angry",

responses:[
"Hừm... Iris buồn đó 😢",
"Đừng nói vậy mà."
]

}

];

const defaultReplies=[

"Mình vẫn đang lắng nghe đây.",

"Bạn có thể nói rõ hơn không?",

"Iris sẽ học thêm để hiểu bạn hơn.",

"Mình chưa hiểu lắm 😊"

];

// ========================================
// Remove Accent
// ========================================

function removeAccent(str){

return str

.normalize("NFD")

.replace(/[\u0300-\u036f]/g,"")

.toLowerCase();

}

// ========================================
// Expression
// ========================================

function setExpression(name){

if(!currentVrm) return;

const em=currentVrm.expressionManager;

if(!em) return;

const list=[

"happy",

"sad",

"angry",

"surprised",

"relaxed"

];

list.forEach(exp=>{

try{

em.setValue(exp,0);

}catch(e){}

});

try{

em.setValue(name,1);

em.update();

}catch(e){}

setTimeout(()=>{

list.forEach(exp=>{

try{

em.setValue(exp,0);

}catch(e){}

});

try{

em.update();

}catch(e){}

},2500);

}

// ========================================
// Chat
// ========================================

function askIris(){

const input=document.getElementById("user-input");

const chat=document.getElementById("chat-box");

const text=input.value.trim();

if(text==="") return;

chat.innerHTML+=`<br><b>Bạn:</b> ${text}`;

chat.scrollTop=chat.scrollHeight;

input.value="";

const clean=removeAccent(text);

setTimeout(()=>{

let answer=null;

for(const item of irisBrain){

for(const key of item.keywords){

if(clean.includes(key)){

answer=item;

break;

}

}

if(answer) break;

}

let reply;

let exp;

if(answer){

reply=answer.responses[
Math.floor(Math.random()*answer.responses.length)
];

exp=answer.expression;

}else{

reply=defaultReplies[
Math.floor(Math.random()*defaultReplies.length)
];

exp="relaxed";

}

chat.innerHTML+=`<br><span style="color:#ffb8ff"><b>Iris:</b> ${reply}</span>`;

chat.scrollTop=chat.scrollHeight;

setExpression(exp);

},500);

}

document

.getElementById("send-btn")

.addEventListener("click",askIris);

document

.getElementById("user-input")

.addEventListener("keydown",(e)=>{

if(e.key==="Enter"){

askIris();

}

});
// ===========================================
// Voice Recognition
// ===========================================

const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.lang = "vi-VN";

    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.onresult = (event)=>{

        const text =
        event.results[0][0].transcript;

        document.getElementById(
        "user-input"
        ).value=text;

        askIris();

    };

    recognition.onerror=(e)=>{

        console.log(e);

    };

}

// ===========================================
// Speak
// ===========================================

function irisSpeak(text){

    speechSynthesis.cancel();

    const speech =
    new SpeechSynthesisUtterance(text);

    speech.lang="vi-VN";

    speech.rate=1;

    speech.pitch=1.2;

    speech.volume=1;

    // mở miệng

    if(currentVrm?.expressionManager){

        try{

            currentVrm.expressionManager
            .setValue("aa",1);

            currentVrm.expressionManager
            .update();

        }catch(e){}

    }

    speech.onend=()=>{

        if(currentVrm?.expressionManager){

            try{

                currentVrm.expressionManager
                .setValue("aa",0);

                currentVrm.expressionManager
                .update();

            }catch(e){}

        }

    };

    speechSynthesis.speak(speech);

}

// ===========================================
// Micro Button
// ===========================================

const micBtn=document.createElement("button");

micBtn.innerHTML="🎤";

micBtn.style.position="absolute";

micBtn.style.right="20px";

micBtn.style.bottom="20px";

micBtn.style.width="60px";

micBtn.style.height="60px";

micBtn.style.borderRadius="50%";

micBtn.style.fontSize="30px";

micBtn.style.cursor="pointer";

document.body.appendChild(micBtn);

micBtn.onclick=()=>{

    if(recognition){

        recognition.start();

    }

};