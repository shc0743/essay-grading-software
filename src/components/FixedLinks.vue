<template>
    <div class="fixed-links">
        <router-link to="/about/">关于</router-link>
        <router-link to="/login/">登录</router-link>
        <router-link to="/settings/">设置</router-link>
    </div>
</template>

<script setup>
</script>

<style scoped>
.fixed-links {
    position: fixed;
    top: 10px;
    right: 10px;
    display: flex;
    z-index: 1000;
    background: transparent;
    pointer-events: none;
}
.fixed-links a {
    pointer-events: auto;
    text-decoration: none;
    color: var(--color);
    font-size: 14px;
    background: var(--background);
    padding: 6px 10px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: background 0.3s, color 0.3s;
}
.fixed-links a:hover {
    background: var(--color);
    color: var(--background);
}
.fixed-links a+a {
    margin-left: 12px;
}
</style>