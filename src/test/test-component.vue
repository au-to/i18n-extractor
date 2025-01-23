<template>
  <div class="test-container">
    <!-- 普通文本 -->
    <h1>测试组件</h1>
    <div class="welcome-text">欢迎使用我们的系统</div>

    <!-- 按钮文本 -->
    <button class="primary-btn" @click="handleSubmit">提交</button>
    <button class="secondary-btn" @click="handleCancel">取消操作</button>

    <!-- 表单标签 -->
    <form class="form-container">
      <div class="form-item">
        <label>用户名：</label>
        <input v-model="formData.username" placeholder="请输入用户名" />
      </div>
      <div class="form-item">
        <label>密码：</label>
        <input type="password" v-model="formData.password" placeholder="请输入密码" />
      </div>
    </form>

    <!-- 列表内容 -->
    <ul class="status-list">
      <li v-for="(status, index) in statusList" :key="index">
        {{ status.label }}: {{ status.value }}
      </li>
    </ul>

    <!-- 提示信息 -->
    <div class="tips-box">
      <p class="warning-text">注意：请确保信息填写完整！</p>
      <p class="error-text">错误：数据提交失败，请重试</p>
    </div>

    <!-- 表格标题 -->
    <table class="data-table">
      <thead>
        <tr>
          <th>序号</th>
          <th>姓名</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>张三</td>
          <td>
            <span class="action-btn">编辑信息</span>
            <span class="action-btn">删除记录</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'TestComponent',
  data() {
    return {
      formData: {
        username: '',
        password: ''
      },
      statusList: [
        { label: '处理中', value: '正在执行相关操作' },
        { label: '已完成', value: '操作已成功完成' },
        { label: '已取消', value: '用户取消了操作' }
      ],
      errorMessage: '系统错误，请联系管理员',
      successMessage: '操作成功完成！'
    }
  },
  methods: {
    handleSubmit() {
      this.$message.success('数据提交成功！');
    },
    handleCancel() {
      this.$confirm('确定要取消当前操作吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });
    },
    showError() {
      this.$message.error('发生了一些错误，请稍后重试');
    },
    validateForm() {
      if (!this.formData.username) {
        return '用户名不能为空';
      }
      if (!this.formData.password) {
        return '密码不能为空';
      }
      return '验证通过';
    }
  }
}
</script>

<style scoped>
.test-container {
  padding: 20px;
}
.form-container {
  margin: 20px 0;
}
.form-item {
  margin-bottom: 15px;
}
.warning-text {
  color: #e6a23c;
}
.error-text {
  color: #f56c6c;
}
.action-btn {
  cursor: pointer;
  margin-right: 10px;
  color: #409eff;
}
</style>