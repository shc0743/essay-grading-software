<template>
  <ActivityView>
    <ActivityTitle>{{ title }}</ActivityTitle>
    <ActivityBody>
      <div class="demo-container">
        <ElButton type="primary" @click="cameraRef?.request()">拍照测试</ElButton>

        <div class="result-area">
          <h3>拍照结果：</h3>
          <div class="canvas-container">
            <canvas ref="canvasRef"></canvas>
          </div>
        </div>

        <TakePhoto ref="cameraRef" @shot="onPhoto" />
      </div>
    </ActivityBody>
  </ActivityView>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElButton } from 'element-plus'
import TakePhoto from '../views/TakePhotoView.vue'

const cameraRef = ref()
const canvasRef = ref()
const title = ref('')

const emit = defineEmits(['update-title'])

// 设置标题
onMounted(() => {
  title.value = '拍照组件测试'
  emit('update-title', title.value)
})

const onPhoto = (blob) => {
  const img = new Image()
  const url = URL.createObjectURL(blob)

  img.onload = () => {
    const canvas = canvasRef.value
    const container = canvas.parentElement
    const ctx = canvas.getContext('2d')

    // 设置 canvas 尺寸匹配图片比例
    const aspectRatio = img.width / img.height
    const maxWidth = 400
    const maxHeight = 300

    let width = maxWidth
    let height = maxWidth / aspectRatio

    if (height > maxHeight) {
      height = maxHeight
      width = maxHeight * aspectRatio
    }

    canvas.width = width
    canvas.height = height
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'

    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)
    URL.revokeObjectURL(url)
  }

  img.src = url
}
</script>

<style scoped>
.demo-container {
  padding: 20px;
}

.result-area {
  margin-top: 20px;
}

.result-area h3 {
  margin-bottom: 10px;
}

.canvas-container {
  display: inline-block;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 4px;
  background: white;
}

canvas {
  display: block;
  max-width: 100%;
  height: auto;
}
</style>