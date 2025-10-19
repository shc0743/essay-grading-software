<template>
    <div class="welcome-view">
        <div class="welcome-view-container">
            <router-link to="/compose/" class="my-card" tabindex="0" role="link">
                <img width="100" src="/assets/image.compressed/composition.webp">
                <span>组卷</span>
            </router-link>
            <router-link to="/grade/" class="my-card" tabindex="0" role="link">
                <img width="100" src="/assets/image.compressed/grading.webp">
                <span>批改</span>
            </router-link>
            <router-link to="/recognite/" class="my-card" tabindex="0" role="link">
                <img width="100" src="/assets/image.compressed/ocr.webp">
                <span>识别</span>
            </router-link>
        </div>
    </div>
</template>

<script setup lang="js">
import { onMounted } from 'vue';

const $emit = defineEmits(['update-title']);
onMounted(() => {
    $emit('update-title', '欢迎');
});
</script>

<style scoped>
.welcome-view {
    display: grid;
    place-items: center;
    height: 100%;
    width: 100%;
    overflow: auto;
}

.welcome-view-container {
    display: grid;
    grid-template-columns: 1fr;
    place-items: center;
}

.big-screen-placeholder {
    display: none;
}

@media screen and (min-width: 600px) {
    .welcome-view-container {
        grid-template-columns: 1fr 1fr 1fr;
    }

    .big-screen-placeholder {
        display: revert;
    }
}

.welcome-view .my-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    border: 1px solid gray;
    border-radius: 10px;
    padding: 0.5em;
    margin: 0.5em;
    cursor: pointer;
    background: var(--background);
    transition: .1s;
    color: var(--color);
    text-decoration: none;

    --background: #ffffff;
    --color: #000000;
}

.welcome-view .my-card:hover {
    --background: #f0f0f0;
}

.welcome-view .my-card:active {
    --background: #d0d0d0;
}

.welcome-view .my-card img {
    border-radius: 10px;
}
</style>
