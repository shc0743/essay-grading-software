<script setup lang="ts">
import { ref, onMounted } from 'vue';

const SenadinaText = ref('');

async function decryptText(encryptedBase64: string, password: string): Promise<string> {
    try {
        // 解码 Base64
        const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        
        // 提取 IV 和加密数据
        const iv = combined.slice(0, 16);
        const encryptedData = combined.slice(16);
        
        // 从密码派生密钥
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode('salt-希娜狄雅'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-CBC', length: 256 },
            false,
            ['decrypt']
        );
        
        // 解密
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-CBC',
                iv: iv
            },
            key,
            encryptedData
        );
        
        return new TextDecoder().decode(decrypted);
    } catch (error) {
        return '解密失败: ' + error;
    }
}

const emit = defineEmits(['update-title']);

onMounted(async () => {
    emit('update-title', '希娜狄雅');

    const encryptedBase64 = "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";
    const password = "希娜狄雅不一样！！";
    
    SenadinaText.value = await decryptText(encryptedBase64, password);
});
</script>

<template>
    <ActivityView>
        <ActivityTitle>希娜狄雅</ActivityTitle>
        <ActivityBody>
            <div class="p">
                <div v-for="value in (SenadinaText.split('\n'))" :key=value v-text="value" class="line"></div>
            </div>
        </ActivityBody>
    </ActivityView>
</template>

<style scoped>
.p > .line {
    margin-bottom: 0.5em;
}
</style>