<template>
    <div class="google-authenticator-page">
        <!-- 公共模块：固定顶部导航，按项目规范去除设计稿中的系统状态栏。 -->
        <van-nav-bar
            :title="$t(isDisableMode ? '谷歌验证器' : '谷歌验证码')"
            :fixed="true"
            :placeholder="true"
            :border="false"
            z-index="99"
            @click-left="handleBack"
        >
            <template #left>
                <span v-if="!isForcedBinding" class="google-authenticator-back df-aic-jucen">
                    <van-icon name="arrow-left" size="16" color="#fff" />
                </span>
            </template>
        </van-nav-bar>

        <!-- 解绑模式：解绑接口要求谷歌动态码，避免无验证码直接解除安全保护。 -->
        <main v-if="isDisableMode" class="google-authenticator-disable-content">
            <section class="google-authenticator-disable-card">
                <span class="google-authenticator-disable-icon df-aic-jucen">
                    <van-icon name="shield-o" size="48" color="#FF9500" />
                </span>
                <h1>{{ $t('解除绑定谷歌验证器') }}</h1>
                <p>{{ $t('解除绑定后，涉及安全验证的操作将不再受到谷歌验证器保护。') }}</p>
                <form class="google-authenticator-disable-form" @submit.prevent="disableGoogleAuthenticator">
                    <label class="google-authenticator-disable-code common-input-focus">
                        <input
                            v-model="verificationCode"
                            type="text"
                            inputmode="numeric"
                            autocomplete="one-time-code"
                            maxlength="6"
                            :placeholder="$t('请输入6位谷歌验证码')"
                            :aria-label="$t('请输入6位谷歌验证码')"
                            @input="normalizeVerificationCode"
                        />
                    </label>
                    <button type="submit" :disabled="isSubmitting">
                        {{ $t('确认解绑') }}
                    </button>
                </form>
            </section>
        </main>

        <main v-else class="google-authenticator-content">
            <!-- 模块一：动态密钥二维码扫描区域。 -->
            <p class="google-authenticator-scan-tip">
                {{ $t('使用谷歌验证器扫描此二维码') }}
            </p>

            <section class="google-authenticator-qr" :aria-label="$t('使用谷歌验证器扫描此二维码')">
                <img
                    src="@img/asset-recharge-corner-left.svg"
                    alt=""
                    class="google-authenticator-qr-corner google-authenticator-qr-corner-top-left"
                />
                <img
                    src="@img/asset-recharge-corner-right.svg"
                    alt=""
                    class="google-authenticator-qr-corner google-authenticator-qr-corner-top-right"
                />
                <img
                    src="@img/asset-recharge-corner-left.svg"
                    alt=""
                    class="google-authenticator-qr-corner google-authenticator-qr-corner-bottom-left"
                />
                <img
                    src="@img/asset-recharge-corner-right.svg"
                    alt=""
                    class="google-authenticator-qr-corner google-authenticator-qr-corner-bottom-right"
                />
                <img src="@img/asset-recharge-qr-frame.svg" alt="" class="google-authenticator-qr-background" />
                <div ref="qrCode" class="google-authenticator-qr-code"></div>
            </section>

            <!-- 模块二：下载、录入密钥与验证三步设置说明。 -->
            <section class="google-authenticator-card">
                <section class="google-authenticator-step google-authenticator-step-download">
                    <h2>{{ $t('步骤1：下载谷歌验证码') }}</h2>
                    <p class="google-authenticator-step-description">
                        {{ $t('请在您的手机上下载以下任一应用：') }}
                    </p>
                    <div class="google-authenticator-apps">
                        <span>Google Authenticator <em>({{ $t('推荐') }})</em></span>
                        <span>Authy</span>
                        <span>Microsoft Authenticator</span>
                    </div>
                </section>

                <section class="google-authenticator-step google-authenticator-step-secret">
                    <h2>{{ $t('步骤2：扫描二维码或手动输入密钥') }}</h2>
                    <p class="google-authenticator-secret-label">{{ $t('手动输入密钥：') }}</p>
                    <button type="button" class="google-authenticator-secret" @click="copySecret">
                        {{ secret }}
                    </button>
                    <p class="google-authenticator-secret-tip">
                        {{ $t('如果无法扫描二维码，请在应用中选择“手动输入”并输入上述密钥') }}
                    </p>
                </section>

                <section class="google-authenticator-step google-authenticator-step-verify">
                    <h2>{{ $t('步骤3：验证设置') }}</h2>
                    <p class="google-authenticator-step-description">
                        {{ $t('在谷歌验证器应用中查看生成的6位验证码，并在下方输入以确认设置成功：') }}
                    </p>

                    <form class="google-authenticator-form" @submit.prevent="confirmSetup">
                        <label class="google-authenticator-code common-input-focus">
                            <input
                                v-model="verificationCode"
                                type="text"
                                inputmode="numeric"
                                autocomplete="one-time-code"
                                maxlength="6"
                                :placeholder="$t('请输入6位验证码')"
                                :aria-label="$t('请输入6位验证码')"
                                @input="normalizeVerificationCode"
                            />
                        </label>
                        <button type="submit" class="google-authenticator-confirm" :disabled="isSubmitting">
                            {{ $t('确认设置') }}
                        </button>
                    </form>
                </section>
            </section>
        </main>
    </div>
</template>

<script>
import QRCode from 'qrcodejs2'

export default {
    name: 'GoogleAuthenticator',
    data() {
        return {
            secret: this.$t('无数据'),
            otpauthUrl: '',
            verificationCode: '',
            isSubmitting: false,
        }
    },
    computed: {
        isForcedBinding() {
            return this.$route.query.forced === '1'
        },
        isDisableMode() {
            return this.$route.query.action === 'disable'
        },
    },
    mounted() {
        if (!this.isDisableMode) {
            this.loadGoogleSetup()
            window.addEventListener('resize', this.renderQrCode)
        }
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.renderQrCode)
    },
    methods: {
        handleBack() {
            if (!this.isForcedBinding) this.$go(1, 1)
        },
        async loadGoogleSetup() {
            try {
                const res = await this.$http.post('/api/users/my/google2fa/setup')
                if (res.code == 200 && res.data) {
                    this.secret = res.data.secret || this.$t('无数据')
                    this.otpauthUrl = res.data.otpauth_url || ''
                    this.renderQrCode()
                }
            } catch (error) {
                console.log('获取谷歌验证器密钥失败', error)
            }
        },
        renderQrCode() {
            this.$nextTick(() => {
                if (!this.$refs.qrCode) return

                this.$refs.qrCode.innerHTML = ''
                const pageWidth = this.$el ? this.$el.getBoundingClientRect().width : window.innerWidth
                const qrSize = Math.round(Math.min(pageWidth, 750) * 300 / 750)
                if (!this.otpauthUrl) return

                new QRCode(this.$refs.qrCode, {
                    text: this.otpauthUrl,
                    width: qrSize,
                    height: qrSize,
                    colorDark: '#000000',
                    colorLight: '#FFFFFF',
                    correctLevel: QRCode.CorrectLevel.H,
                })
            })
        },
        copySecret() {
            if (!this.secret || this.secret === this.$t('无数据')) {
                this.$toast(this.$t('暂无谷歌验证密钥'))
                return
            }
            this.$copyText(this.secret).then(() => {
                this.$messageTip.success(this.$t('复制成功'))
            }).catch(() => {
                this.$messageTip.error(this.$t('复制失败'))
            })
        },
        normalizeVerificationCode(event) {
            this.verificationCode = String(event.target.value || '').replace(/\D/g, '').slice(0, 6)
        },
        async confirmSetup() {
            if (this.isSubmitting) return
            if (!/^\d{6}$/.test(this.verificationCode)) {
                this.$toast(this.$t('请完整输入6位验证码'))
                return
            }

            this.isSubmitting = true
            try {
                const res = await this.$http.post('/api/users/my/google2fa/confirm', {
                    google_code: this.verificationCode,
                })
                if (res.code == 200) {
                    this.$messageTip.success(this.$t('谷歌验证设置已确认'))
                    if (this.isForcedBinding) {
                        this.$router.replace({ name: 'index' })
                    } else {
                        this.$go(1, 1)
                    }
                }
            } catch (error) {
                console.log('确认谷歌验证器失败', error)
            } finally {
                this.isSubmitting = false
            }
        },
        async disableGoogleAuthenticator() {
            if (this.isSubmitting) return
            if (!/^\d{6}$/.test(this.verificationCode)) {
                this.$toast(this.$t('请输入6位谷歌验证码'))
                return
            }

            this.isSubmitting = true
            try {
                const res = await this.$http.post('/api/users/my/google2fa/disable', {
                    google_code: this.verificationCode,
                })
                if (res.code == 200) {
                    this.$messageTip.success(this.$t('解绑成功'))
                    this.$router.replace({ name: 'settings' })
                }
            } catch (error) {
                console.log('解绑谷歌验证器失败', error)
            } finally {
                this.isSubmitting = false
            }
        },
    },
}
</script>

<style scoped lang="less">
.google-authenticator-page {
    position: relative;
    width: 750px;
    height: 1583px;
    min-height: 100vh;
    margin: 0 auto;
    overflow-x: hidden;
    background: #000308;
    color: #FFFFFF;

    button,
    input {
        margin: 0;
        padding: 0;
        border: 0;
        outline: 0;
        appearance: none;
        -webkit-appearance: none;
        background: transparent;
        color: inherit;
        font: inherit;
    }

    // 固定导航：原设计稿顶部 40px 系统状态栏不渲染。
    /deep/ .van-nav-bar__placeholder,
    /deep/ .van-nav-bar,
    /deep/ .van-nav-bar__content {
        height: 88px;
    }

    /deep/ .van-nav-bar {
        background: rgba(0, 0, 0, 0.60) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;

        .van-nav-bar__title {
            color: #FFFFFF;
            font-size: 32px;
            font-weight: 600;
            line-height: 45px;
        }

        .van-nav-bar__left {
            left: 30px;
            padding: 0;
        }
    }

    .google-authenticator-back {
        width: 48px;
        height: 48px;
    }

    // 解绑模式：延续项目深色毛玻璃卡片和蓝色主按钮风格。
    .google-authenticator-disable-content {
        min-height: calc(100vh - 88px);
        padding: 168px 30px 60px;

        .google-authenticator-disable-card {
            width: 690px;
            padding: 54px 40px 44px;
            border: 1px solid rgba(255, 149, 0, 0.26);
            border-radius: 32px;
            background: linear-gradient(145deg, rgba(30, 38, 53, 0.96), rgba(18, 23, 32, 0.96));
            box-shadow: 0 16px 52px rgba(0, 0, 0, 0.30);
            text-align: center;

            .google-authenticator-disable-icon {
                width: 96px;
                height: 96px;
                margin: 0 auto;
                border-radius: 50%;
                background: rgba(255, 149, 0, 0.12);
            }

            h1 {
                margin: 30px 0 0;
                font-size: 34px;
                font-weight: 600;
                line-height: 48px;
            }

            p {
                margin: 22px 0 0;
                color: rgba(184, 195, 212, 0.72);
                font-size: 24px;
                line-height: 36px;
                text-align: left;
            }

            .google-authenticator-disable-form {
                margin-top: 46px;

                .google-authenticator-disable-code {
                    display: block;
                    width: 610px;
                    height: 88px;
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.08);

                    input {
                        display: block;
                        width: 100%;
                        height: 86px;
                        padding: 0 30px;
                        caret-color: #4C91FF;
                        font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                        font-size: 28px;
                        line-height: 86px;

                        &::placeholder {
                            color: rgba(184, 195, 212, 0.50);
                        }
                    }
                }

                button {
                    width: 610px;
                    height: 88px;
                    margin-top: 24px;
                    border-radius: 999px;
                    background: #1261F3;
                    font-size: 28px;
                    font-weight: 500;
                    line-height: 88px;

                    &:active {
                        transform: scale(0.98);
                    }

                    &:disabled {
                        opacity: 0.60;
                    }
                }
            }
        }
    }

    .google-authenticator-content {
        position: relative;
        width: 750px;
        height: 1495px;

        // 模块一：二维码扫描区
        .google-authenticator-scan-tip {
            position: absolute;
            top: 40px;
            left: 0;
            width: 750px;
            margin: 0;
            font-size: 24px;
            line-height: 34px;
            text-align: center;
        }

        .google-authenticator-qr {
            position: absolute;
            top: 134px;
            left: 135px;
            width: 480px;
            height: 480px;
            border-radius: 56px;
            background: linear-gradient(
                180deg,
                rgba(0, 132, 255, 0) 0%,
                rgba(0, 132, 255, 0.20) 50%,
                rgba(0, 132, 255, 0) 100%
            );

            .google-authenticator-qr-corner {
                position: absolute;
                z-index: 2;
                display: block;
                width: 90px;
                height: 90px;

                &.google-authenticator-qr-corner-top-left {
                    top: 0;
                    left: 0;
                    transform: rotate(90deg);
                }

                &.google-authenticator-qr-corner-top-right {
                    top: 0;
                    right: 0;
                    transform: rotate(180deg);
                }

                &.google-authenticator-qr-corner-bottom-left {
                    bottom: 0;
                    left: 0;
                }

                &.google-authenticator-qr-corner-bottom-right {
                    right: 0;
                    bottom: 0;
                    transform: rotate(-90deg);
                }
            }

            .google-authenticator-qr-background {
                position: absolute;
                z-index: 1;
                top: 60px;
                left: 60px;
                display: block;
                width: 360px;
                height: 360px;
                pointer-events: none;
            }

            .google-authenticator-qr-code {
                position: absolute;
                z-index: 2;
                top: 90px;
                left: 90px;
                width: 300px;
                height: 300px;
                overflow: hidden;

                /deep/ img,
                /deep/ canvas {
                    display: block !important;
                    width: 300px !important;
                    height: 300px !important;
                }
            }
        }

        // 模块二：三步设置卡片
        .google-authenticator-card {
            position: absolute;
            top: 674px;
            left: 30px;
            width: 690px;
            height: 791px;
            border-radius: 20px;
            background: #1A1D22;

            .google-authenticator-step {
                position: absolute;
                left: 30px;
                width: 630px;

                h2,
                p {
                    margin: 0;
                }

                h2 {
                    font-size: 28px;
                    font-weight: 500;
                    line-height: 39px;
                }

                .google-authenticator-step-description {
                    color: rgba(255, 255, 255, 0.50);
                    font-size: 24px;
                    line-height: 36px;
                }

                &.google-authenticator-step-download {
                    top: 40px;

                    .google-authenticator-step-description {
                        margin-top: 24px;
                    }

                    .google-authenticator-apps {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 20px;
                        margin-top: 20px;
                        font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                        font-size: 24px;
                        line-height: 34px;

                        span {
                            text-decoration: underline;
                            text-decoration-color: #5A5A5A;
                            text-underline-offset: 5px;
                        }

                        em {
                            color: #FF4A4A;
                            font-style: normal;
                        }
                    }
                }

                &.google-authenticator-step-secret {
                    top: 289px;

                    .google-authenticator-secret-label {
                        margin-top: 24px;
                        color: #FF9500;
                        font-size: 24px;
                        line-height: 34px;
                    }

                    .google-authenticator-secret {
                        display: block;
                        max-width: 100%;
                        margin-top: 12px;
                        color: #4C91FF;
                        font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                        font-size: 24px;
                        line-height: 34px;
                        text-align: left;
                        text-decoration: underline;
                        text-underline-offset: 4px;
                    }

                    .google-authenticator-secret-tip {
                        margin-top: 12px;
                        color: #FF9500;
                        font-size: 20px;
                        line-height: 28px;
                    }
                }

                &.google-authenticator-step-verify {
                    top: 512px;

                    .google-authenticator-step-description {
                        margin-top: 24px;
                    }

                    .google-authenticator-form {
                        position: absolute;
                        top: 151px;
                        left: 0;
                        display: flex;
                        gap: 8px;
                        width: 630px;
                        height: 88px;

                        .google-authenticator-code {
                            display: block;
                            width: 460px;
                            height: 88px;
                            border-radius: 20px;
                            background: rgba(255, 255, 255, 0.10);

                            input {
                                display: block;
                                width: 100%;
                                height: 88px;
                                padding: 0 30px;
                                caret-color: #4C91FF;
                                font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                                font-size: 28px;
                                line-height: 88px;

                                &::placeholder {
                                    color: rgba(184, 195, 212, 0.50);
                                }
                            }
                        }

                        .google-authenticator-confirm {
                            width: 162px;
                            height: 88px;
                            border-radius: 20px;
                            background: #1261F3;
                            font-size: 26px;
                            line-height: 88px;
                            transition: opacity 0.2s ease, transform 0.2s ease;

                            &:active {
                                transform: scale(0.96);
                            }

                            &:disabled {
                                opacity: 0.60;
                            }
                        }
                    }
                }
            }
        }
    }
}
</style>
