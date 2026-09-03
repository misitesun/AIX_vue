<template>
    <div class="page-mine">
        <!-- 公共模块：固定顶部导航 -->
        <home-nav-bar
            theme="assets"
            @click-notice="$go(2, '/noticeList')"
        />

        <!-- 页面主体：整页使用 Mescroll，上滑至成员列表底部后继续分页加载。 -->
        <mescroll-vue
            ref="mescroll"
            class="mine-page-scroll"
            :up="mescrollUp"
            @init="mescrollInit"
        >
            <main class="mine-page-content" :style="{ height: pageHeight }">
                <!-- 模块一：页面氛围背景 -->
                <img src="@img/mine-page-bg.png" alt="" class="page-mine-background" />

                <!-- 模块二：用户身份、邀请码与邀请链接 -->
                <section class="mine-profile">
            <div class="mine-profile-heading df-aic-jusb">
                <h1 class="mine-profile-email">
                    <template v-if="profile.email">{{ profile.email }}</template>
                    <template v-else-if="profile.address">{{ profile.address | addrHide }}</template>
                    <template v-else>{{ $t('无数据') }}</template>
                </h1>
                <span class="mine-rank">
                    <img src="@img/mine-rank-badge.svg" alt="" class="mine-rank-background" />
                    <span class="mine-rank-content df-aic">
                        <img :src="profile.levelIcon || defaultRankIcon" alt="" />
                        <span>{{ profile.level }}</span>
                    </span>
                </span>
            </div>

            <button type="button" class="mine-invite-code df-aic" @click="copyText(profile.inviteCode)">
                <span>{{ $t('邀请码') }} {{ profile.inviteCode }}</span>
                <img src="@img/mine-copy-code.svg" alt="" />
            </button>

            <div class="mine-invite-link df-aic">
                <img src="@img/mine-link.svg" alt="" class="mine-invite-link-icon" />
                <span class="mine-invite-link-text text-line-1">{{ profile.inviteUrl }}</span>
                <button
                    type="button"
                    class="mine-invite-link-copy df-aic-jucen"
                    :aria-label="$t('复制')"
                    @click="copyText(profile.inviteUrl)"
                >
                    <img src="@img/mine-copy-link.svg" alt="" />
                </button>
            </div>
                </section>

                <!-- 模块三：团队、小区与个人业绩概览 -->
                <section class="mine-performance">
            <div class="mine-performance-item">
                <img src="@img/mine-stat-team.svg" alt="" class="mine-performance-icon" />
                <div class="mine-performance-value">
                    <span>{{ splitDecimal(performance.team).integer }}</span>
                    <span class="mine-performance-decimal">{{ splitDecimal(performance.team).decimal }}</span>
                </div>
                <div class="mine-performance-label">{{ $t('团队业绩(USDT)') }}</div>
            </div>
            <span class="mine-performance-divider"></span>
            <div class="mine-performance-item">
                <img src="@img/mine-stat-area.svg" alt="" class="mine-performance-icon" />
                <div class="mine-performance-value">
                    <span>{{ splitDecimal(performance.area).integer }}</span>
                    <span class="mine-performance-decimal">{{ splitDecimal(performance.area).decimal }}</span>
                </div>
                <div class="mine-performance-label">{{ $t('小区业绩(USDT)') }}</div>
            </div>
            <span class="mine-performance-divider"></span>
            <div class="mine-performance-item">
                <img src="@img/mine-stat-personal.svg" alt="" class="mine-performance-icon" />
                <div class="mine-performance-value">
                    <span>{{ splitDecimal(performance.personal).integer }}</span>
                    <span class="mine-performance-decimal">{{ splitDecimal(performance.personal).decimal }}</span>
                </div>
                <div class="mine-performance-label">{{ $t('个人业绩(USDT)') }}</div>
            </div>
                </section>

                <!-- 模块四：团队人数卡片 -->
                <section class="mine-team-summary">
            <div class="mine-direct-card">
                <div class="mine-direct-avatars df-aic">
                    <img src="@img/mine-avatar-1.png" alt="" />
                    <img src="@img/mine-avatar-2.png" alt="" />
                    <img src="@img/mine-avatar-3.png" alt="" />
                </div>
                <div class="mine-direct-label">{{ $t('直推人数') }}</div>
                <div class="mine-direct-value">
                    <span>{{ team.directCount }}</span>
                    <span>{{ $t('人') }}</span>
                </div>
            </div>

            <div class="mine-team-card">
                <img src="@img/mine-team-glow.svg" alt="" class="mine-team-glow" />
                <img src="@img/mine-team-visual.png" alt="" class="mine-team-visual" />
                <div class="mine-team-copy">
                    <div class="mine-team-label">{{ $t('团队总人数') }}</div>
                    <div class="mine-team-value">
                        <span>{{ team.totalCount }}</span>
                        <span>{{ $t('人') }}</span>
                    </div>
                    <span class="mine-team-accent"></span>
                </div>
            </div>
                </section>

                <!-- 模块五：入金订单入口 -->
                <button
            type="button"
            class="mine-deposit-card"
            @click="$router.push('/mine/deposit-orders')"
        >
            <img src="@img/mine-deposit-banner.png" alt="" class="mine-deposit-background" />
            <span class="mine-deposit-copy">
                <span class="mine-deposit-title">{{ $t('入金订单') }}</span>
                <span class="mine-deposit-subtitle">{{ $t('查看入金记录与订单状态') }}</span>
            </span>
            <img src="@img/mine-arrow.svg" alt="" class="mine-deposit-arrow" />
                </button>

                <!-- 模块六：直属成员分页列表 -->
                <section class="mine-members">
            <h2 class="mine-members-title">{{ $t('成员列表') }}</h2>
            <div class="mine-members-list">
                <article v-for="member in members" :key="member.id" class="mine-member-card">
                    <div class="mine-member-heading df-aic">
                        <span class="mine-member-email" :title="member.memail">{{ member.displayName }}</span>
                        <button
                            type="button"
                            class="mine-member-edit"
                            :aria-label="$t('编辑')"
                            @click="openRemarkEditor(member)"
                        >
                            <img src="@img/mine-edit.svg" alt="" />
                        </button>
                    </div>

                    <span class="mine-rank mine-member-rank">
                        <img src="@img/mine-rank-badge.svg" alt="" class="mine-rank-background" />
                        <span class="mine-rank-content df-aic">
                            <img :src="member.levelIcon || defaultRankIcon" alt="" />
                            <span>{{ member.level }}</span>
                        </span>
                    </span>

                    <time class="mine-member-time">{{ member.joinedAt }}</time>
                    <span class="mine-member-divider"></span>

                    <div class="mine-member-metrics">
                        <div class="mine-member-metric df-aic-jusb">
                            <span class="mine-member-metric-label">{{ $t('团队业绩') }}</span>
                            <span>{{ member.teamPerformance }} Token</span>
                        </div>
                        <div class="mine-member-metric df-aic-jusb">
                            <span class="mine-member-metric-label">{{ $t('个人业绩') }}</span>
                            <span>{{ member.personalPerformance }} Token</span>
                        </div>
                        <div class="mine-member-metric df-aic-jusb">
                            <span class="mine-member-metric-label">{{ $t('今日打卡') }}</span>
                            <span
                                class="mine-member-checkin df-aic"
                                :class="{ 'is-done': member.checkedIn }"
                            >
                                <img
                                    :src="member.checkedIn ? checkinDoneIcon : checkinPendingIcon"
                                    alt=""
                                />
                                <span>{{ member.checkedIn ? $t('已打卡') : $t('待打卡') }}</span>
                            </span>
                        </div>
                    </div>
                </article>
                <no-data v-if="!members.length"></no-data>
            </div>
                </section>
            </main>
        </mescroll-vue>

        <!-- 模块七：直属成员备注编辑。接口中的 remark 作为成员展示名称。 -->
        <div
            v-if="showRemarkEditor"
            class="mine-remark-overlay"
            role="dialog"
            aria-modal="true"
            @click.self="closeRemarkEditor"
            @touchmove.prevent
        >
            <section class="mine-remark-panel">
                <h2>{{ $t('编辑成员备注') }}</h2>
                <p>{{ editingMemberAddress }}</p>
                <label class="mine-remark-field common-input-focus">
                    <input
                        ref="remarkInput"
                        v-model="editingRemark"
                        type="text"
                        maxlength="255"
                        :placeholder="$t('请输入成员备注')"
                        @keyup.enter="saveMemberRemark"
                    />
                </label>
                <div class="mine-remark-actions df-aic">
                    <button type="button" class="mine-remark-cancel" :disabled="isSavingRemark" @click="closeRemarkEditor">
                        {{ $t('取消') }}
                    </button>
                    <button type="button" class="mine-remark-save" :disabled="isSavingRemark" @click="saveMemberRemark">
                        {{ isSavingRemark ? $t('提交中') : $t('保存') }}
                    </button>
                </div>
            </section>
        </div>

        <!-- 公共模块：固定悬浮底部 TabBar -->
        <home-tab-bar active="mine" @change="handleTabChange" />
    </div>
</template>

<script>
import HomeNavBar from '@/components/homeNavBar'
import HomeTabBar from '@/components/homeTabBar'
import checkinDoneIcon from '@img/mine-checkin-done.svg'
import checkinPendingIcon from '@img/mine-checkin-pending.svg'
import defaultRankIcon from '@img/mine-rank-icon.png'

export default {
    name: 'Mine',
    components: {
        HomeNavBar,
        HomeTabBar,
    },
    data() {
        return {
            checkinDoneIcon,
            checkinPendingIcon,
            defaultRankIcon,
            profile: {
                email: '',
                address: '',
                level: this.$t('无数据'),
                levelIcon: '',
                inviteCode: this.$t('无数据'),
                inviteUrl: this.$t('无数据'),
            },
            performance: {
                team: this.$t('无数据'),
                area: this.$t('无数据'),
                personal: this.$t('无数据'),
            },
            team: {
                directCount: this.$t('无数据'),
                totalCount: this.$t('无数据'),
            },
            mescroll: null,
            mescrollUp: {
                callback: this.upCallback,
                page: {
                    num: 0,
                    size: 20,
                },
                noMoreSize: 5,
                htmlNodata: '',
                empty: {
                    use: false,
                },
            },
            members: [],
            showRemarkEditor: false,
            editingMemberId: null,
            editingMemberAddress: '',
            editingRemark: '',
            isSavingRemark: false,
            previousBodyOverflow: '',
        }
    },
    computed: {
        pageHeight() {
            const designHeight = Math.max(2060, 1380 + Math.max(this.members.length, 2) * 373)
            return `${designHeight / 75}rem`
        },
    },
    mounted() {
        this.loadMineData()
    },
    beforeDestroy() {
        if (this.showRemarkEditor) document.body.style.overflow = this.previousBodyOverflow
    },
    methods: {
        loadMineData() {
            this.loadProfile()
            this.loadStatistics()
        },
        mescrollInit(mescroll) {
            this.mescroll = mescroll
        },
        async loadProfile() {
            try {
                const res = await this.$http.get('/api/users/my')
                if (res.code == 200 && res.data) {
                    const info = res.data
                    const referralCode = info.referral_code || this.$t('无数据')
                    this.profile = {
                        email: String(info.email || '').trim(),
                        address: String(info.address || '').trim(),
                        level: info.level && info.level.name ? info.level.name : this.$t('无数据'),
                        levelIcon: info.level && info.level.icon ? info.level.icon : '',
                        inviteCode: referralCode,
                        inviteUrl: info.referral_code
                            ? `${window.location.origin}${this.$router.options.base}?ref=${encodeURIComponent(info.referral_code)}`
                            : this.$t('无数据'),
                    }
                }
            } catch (error) {
                console.log('用户资料加载失败', error)
            }
        },
        async loadStatistics() {
            try {
                const res = await this.$http.get('/api/users/my/statistics')
                if (res.code == 200 && res.data) {
                    this.performance = {
                        team: res.data.team_kpi || this.$t('无数据'),
                        area: res.data.xq_kpi || this.$t('无数据'),
                        personal: res.data.kpi || this.$t('无数据'),
                    }
                    this.team = {
                        directCount: res.data.invite_count === undefined ? this.$t('无数据') : res.data.invite_count,
                        totalCount: res.data.team_count === undefined ? this.$t('无数据') : res.data.team_count,
                    }
                }
            } catch (error) {
                console.log('用户统计加载失败', error)
            }
        },
        // Mescroll 分页：接口字段以 memail 为成员邮箱，remark 非空时覆盖展示名称。
        async upCallback(page, mescroll) {
            try {
                const res = await this.$http.get('/api/users/my/referrals', {
                    page_no: page.num,
                    page_size: Math.min(page.size || 20, 20),
                })
                const referrals = res.code == 200 && res.data && Array.isArray(res.data.referrals)
                    ? res.data.referrals
                    : []
                const currentPageMembers = referrals.map(member => this.mapMember(member))
                if (page.num === 1) this.members = []
                this.members = this.members.concat(currentPageMembers)
                this.$nextTick(() => mescroll.endSuccess(referrals.length))
            } catch (error) {
                console.log('直属成员加载失败', error)
                mescroll.endErr()
            }
        },
        mapMember(member) {
            const memail = member.memail || this.$t('无数据')
            const remark = String(member.remark || '').trim()
            return {
                id: member.id,
                memail,
                remark,
                displayName: remark || memail,
                level: member.level && member.level.name ? member.level.name : this.$t('无数据'),
                levelIcon: member.level && member.level.icon ? member.level.icon : '',
                joinedAt: member.created_at || this.$t('无数据'),
                teamPerformance: member.team_kpi || this.$t('无数据'),
                personalPerformance: member.kpi || this.$t('无数据'),
                checkedIn: Boolean(member.is_signed_today),
            }
        },
        openRemarkEditor(member) {
            this.editingMemberId = member.id
            this.editingMemberAddress = member.memail
            this.editingRemark = member.remark
            this.previousBodyOverflow = document.body.style.overflow
            document.body.style.overflow = 'hidden'
            this.showRemarkEditor = true
            this.$nextTick(() => {
                if (this.$refs.remarkInput) this.$refs.remarkInput.focus()
            })
        },
        closeRemarkEditor() {
            if (this.isSavingRemark) return
            this.showRemarkEditor = false
            this.editingMemberId = null
            this.editingMemberAddress = ''
            this.editingRemark = ''
            document.body.style.overflow = this.previousBodyOverflow
        },
        async saveMemberRemark() {
            if (this.isSavingRemark || !this.editingMemberId) return
            const remark = String(this.editingRemark || '').trim()
            this.isSavingRemark = true
            try {
                const res = await this.$http.post(`/api/users/my/referrals/${this.editingMemberId}/remark`, {
                    remark,
                })
                if (res.code == 200) {
                    const memberIndex = this.members.findIndex(member => member.id === this.editingMemberId)
                    if (memberIndex !== -1) {
                        const member = this.members[memberIndex]
                        this.$set(this.members, memberIndex, {
                            ...member,
                            remark,
                            displayName: remark || member.memail,
                        })
                    }
                    this.$messageTip.success(this.$t('成员备注保存成功'))
                    this.isSavingRemark = false
                    this.closeRemarkEditor()
                }
            } catch (error) {
                console.log('成员备注保存失败', error)
            } finally {
                this.isSavingRemark = false
            }
        },
        handleTabChange(tab) {
            const routeMap = {
                index: '/index',
                node: '/node',
                assets: '/assets',
            }
            if (routeMap[tab]) {
                this.$go(2, routeMap[tab])
            }
        },
        copyText(value) {
            this.$copyText(value).then(() => {
                this.$messageTip.success(this.$t('复制成功'))
            }).catch(() => {
                this.$messageTip.error(this.$t('复制失败'))
            })
        },
        // 仅为匹配设计稿中的字号层级拆分小数，不修改接口原始值。
        splitDecimal(value) {
            const parts = String(value || '').split('.')
            return {
                integer: parts[0],
                decimal: parts.length > 1 ? `.${parts.slice(1).join('.')}` : '',
            }
        },
    },
}
</script>

<style scoped lang="less">
.page-mine {
    position: relative;
    width: 750px;
    height: 100vh;
    margin: 0 auto;
    overflow: hidden;
    background: #01050C;
    color: #FFFFFF;

    button {
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

    // 页面滚动容器：顶部与底部公共导航保持固定，主体负责整页分页滚动。
    .mine-page-scroll {
        position: fixed;
        z-index: 1;
        top: 0;
        bottom: 0;
        left: 50%;
        width: 750px;
        height: auto;
        transform: translateX(-50%);
        background: #01050C;

        .mine-page-content {
            position: relative;
            width: 750px;
            min-height: 100%;
            overflow: hidden;
        }
    }

    // 模块一：Figma 顶部氛围背景
    .page-mine-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 750px;
        height: 810px;
        object-fit: cover;
        pointer-events: none;
    }

    // 公共等级徽章：背景、图标与文字保持独立，方便后续替换真实等级。
    .mine-rank {
        position: relative;
        display: inline-flex;
        width: 120px;
        height: 54px;
        flex: 0 0 auto;

        .mine-rank-background {
            position: absolute;
            inset: 0;
            width: 120px;
            height: 54px;
        }

        .mine-rank-content {
            position: absolute;
            top: 7px;
            left: 20px;
            height: 40px;
            gap: 8px;
            font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
            font-size: 24px;
            font-weight: 700;
            line-height: 36px;

            img {
                width: 40px;
                height: 40px;
                object-fit: contain;
            }
        }
    }

    // 模块二：用户资料和邀请信息
    .mine-profile {
        position: absolute;
        top: 200px;
        left: 30px;
        width: 690px;
        height: 217px;

        .mine-profile-heading {
            width: 690px;
            height: 54px;

            .mine-profile-email {
                height: 54px;
                margin: 0;
                font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                font-size: 36px;
                font-weight: 700;
                line-height: 54px;
                letter-spacing: -0.4px;
            }
        }

        .mine-invite-code {
            position: absolute;
            top: 74px;
            left: 0;
            height: 39px;
            gap: 12px;
            color: #4C91FF;
            font-size: 26px;
            font-weight: 400;
            line-height: 39px;

            img {
                width: 30px;
                height: 30px;
            }
        }

        .mine-invite-link {
            position: absolute;
            top: 143px;
            left: 0;
            width: 690px;
            height: 74px;
            padding: 16px;
            gap: 12px;
            border: 1px solid rgba(255, 255, 255, 0.20);
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.10);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);

            .mine-invite-link-icon {
                width: 42px;
                height: 42px;
                flex: 0 0 auto;
            }

            .mine-invite-link-text {
                width: 554px;
                color: rgba(255, 255, 255, 0.90);
                font-size: 24px;
                font-weight: 400;
                line-height: 34px;
            }

            .mine-invite-link-copy {
                width: 30px;
                height: 30px;
                flex: 0 0 auto;

                img {
                    width: 30px;
                    height: 30px;
                }
            }
        }
    }

    // 模块三：三项业绩统计
    .mine-performance {
        position: absolute;
        top: 457px;
        left: 31px;
        display: grid;
        width: 688px;
        height: 168px;
        grid-template-columns: 214px 1px 214px 1px 214px;
        column-gap: 11px;

        .mine-performance-item {
            position: relative;
            width: 214px;
            height: 168px;
            text-align: center;

            .mine-performance-icon {
                display: block;
                width: 72px;
                height: 72px;
                margin: 0 auto;
            }

            .mine-performance-value {
                height: 45px;
                margin-top: 10px;
                font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                font-size: 30px;
                font-weight: 500;
                line-height: 45px;
                white-space: nowrap;

                .mine-performance-decimal {
                    font-size: 24px;
                }
            }

            .mine-performance-label {
                height: 31px;
                margin-top: 10px;
                color: rgba(255, 255, 255, 0.50);
                font-size: 22px;
                font-weight: 400;
                line-height: 31px;
                white-space: nowrap;
            }
        }

        .mine-performance-divider {
            width: 1px;
            height: 110px;
            margin-top: 29px;
            background: rgba(255, 255, 255, 0.12);
        }
    }

    // 模块四：直推人数和团队总人数
    .mine-team-summary {
        position: absolute;
        top: 665px;
        left: 30px;
        display: flex;
        width: 690px;
        height: 226px;
        gap: 20px;

        .mine-direct-card,
        .mine-team-card {
            position: relative;
            height: 226px;
            overflow: hidden;
            border-radius: 36px;
            background: rgba(255, 255, 255, 0.10);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
        }

        .mine-direct-card {
            width: 248px;
            flex: 0 0 248px;
            text-align: center;

            .mine-direct-avatars {
                position: absolute;
                top: 30px;
                left: 48px;
                width: 152px;
                height: 72px;

                img {
                    position: relative;
                    width: 72px;
                    height: 72px;
                    flex: 0 0 72px;
                    object-fit: contain;

                    + img {
                        margin-left: -32px;
                    }

                    &:nth-child(1) {
                        z-index: 1;
                    }

                    &:nth-child(2) {
                        z-index: 2;
                    }

                    &:nth-child(3) {
                        z-index: 3;
                    }
                }
            }

            .mine-direct-label {
                position: absolute;
                top: 122px;
                left: 0;
                width: 248px;
                height: 36px;
                font-size: 24px;
                font-weight: 400;
                line-height: 36px;
            }

            .mine-direct-value {
                position: absolute;
                top: 160px;
                left: 0;
                width: 248px;
                height: 48px;
                color: #4C91FF;
                font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                font-size: 32px;
                font-weight: 500;
                line-height: 48px;

                span:last-child {
                    margin-left: 4px;
                    font-size: 24px;
                    font-weight: 400;
                    line-height: 36px;
                }
            }
        }

        .mine-team-card {
            width: 421px;
            flex: 0 0 421px;

            .mine-team-glow {
                position: absolute;
                top: -145px;
                left: 29px;
                width: 770px;
                height: 686px;
                pointer-events: none;
            }

            .mine-team-visual {
                position: absolute;
                top: -45px;
                left: 100px;
                width: 405px;
                height: 405px;
                max-width: none;
                transform: rotate(-22.05deg);
                object-fit: contain;
                pointer-events: none;
            }

            .mine-team-copy {
                position: relative;
                z-index: 2;
                margin: 30px 0 0 30px;

                .mine-team-label {
                    height: 36px;
                    font-size: 24px;
                    font-weight: 400;
                    line-height: 36px;
                }

                .mine-team-value {
                    height: 60px;
                    margin-top: 20px;
                    background: linear-gradient(180deg, #9CC2FF 0%, #4C91FF 100%);
                    background-clip: text;
                    -webkit-background-clip: text;
                    color: transparent;
                    font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                    font-size: 40px;
                    font-weight: 700;
                    line-height: 60px;

                    span:last-child {
                        margin-left: 5px;
                        font-size: 24px;
                        font-weight: 500;
                        line-height: 36px;
                    }
                }

                .mine-team-accent {
                    display: block;
                    width: 52px;
                    height: 4px;
                    margin-top: 41px;
                    background: linear-gradient(90deg, #4C91FF 0%, #9CC2FF 100%);
                }
            }
        }
    }

    // 模块五：入金订单入口
    .mine-deposit-card {
        position: absolute;
        top: 921px;
        left: 30px;
        width: 690px;
        height: 198px;
        overflow: hidden;
        border-radius: 32px;
        background: rgba(255, 255, 255, 0.10);
        text-align: left;

        .mine-deposit-background {
            position: absolute;
            inset: 0;
            width: 690px;
            height: 198px;
            pointer-events: none;
        }

        .mine-deposit-copy {
            position: absolute;
            top: 47px;
            left: 280px;
            display: flex;
            width: 300px;
            flex-direction: column;

            .mine-deposit-title {
                height: 50px;
                font-size: 36px;
                font-weight: 600;
                line-height: 50px;
            }

            .mine-deposit-subtitle {
                height: 34px;
                margin-top: 20px;
                color: #B8C3D4;
                font-size: 24px;
                font-weight: 400;
                line-height: 34px;
                white-space: nowrap;
            }
        }

        .mine-deposit-arrow {
            position: absolute;
            top: 82px;
            right: 30px;
            width: 34px;
            height: 34px;
        }
    }

    // 模块六：成员列表
    .mine-members {
        position: absolute;
        top: 1149px;
        left: 30px;
        width: 690px;

        .mine-members-title {
            height: 45px;
            margin: 0;
            font-size: 32px;
            font-weight: 400;
            line-height: 45px;
        }

        .mine-members-list {
            display: flex;
            margin-top: 24px;
            flex-direction: column;
            gap: 20px;

            .mine-member-card {
                position: relative;
                width: 690px;
                height: 353px;
                flex: 0 0 353px;
                border-radius: 32px;
                background: rgba(255, 255, 255, 0.10);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);

                .mine-member-heading {
                    position: absolute;
                    top: 30px;
                    left: 30px;
                    height: 42px;
                    gap: 12px;

                    .mine-member-email {
                        max-width: 430px;
                        overflow: hidden;
                        font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                        font-size: 28px;
                        font-weight: 600;
                        line-height: 42px;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .mine-member-edit {
                        width: 28px;
                        height: 28px;

                        img {
                            display: block;
                            width: 28px;
                            height: 28px;
                        }
                    }
                }

                .mine-member-rank {
                    position: absolute;
                    top: 30px;
                    right: 30px;
                }

                .mine-member-time {
                    position: absolute;
                    top: 84px;
                    left: 30px;
                    height: 34px;
                    color: rgba(255, 255, 255, 0.50);
                    font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                    font-size: 24px;
                    font-weight: 400;
                    font-style: normal;
                    line-height: 34px;
                }

                .mine-member-divider {
                    position: absolute;
                    top: 146px;
                    left: 30px;
                    width: 630px;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.12);
                }

                .mine-member-metrics {
                    position: absolute;
                    top: 175px;
                    left: 30px;
                    display: flex;
                    width: 630px;
                    flex-direction: column;
                    gap: 20px;

                    .mine-member-metric {
                        width: 630px;
                        height: 36px;
                        font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                        font-size: 24px;
                        font-weight: 400;
                        line-height: 36px;

                        .mine-member-metric-label {
                            color: rgba(255, 255, 255, 0.50);
                        }

                        .mine-member-checkin {
                            gap: 6px;
                            color: #B8C3D4;

                            &.is-done {
                                color: #B7FF2D;
                            }

                            img {
                                width: 32px;
                                height: 32px;
                            }
                        }
                    }
                }
            }
        }
    }

    // 模块七：成员备注编辑弹窗
    .mine-remark-overlay {
        position: fixed;
        top: 0;
        left: 50%;
        z-index: 500;
        display: flex;
        width: 750px;
        height: 100vh;
        align-items: center;
        justify-content: center;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.68);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);

        .mine-remark-panel {
            width: 630px;
            padding: 40px;
            border: 2px solid rgba(76, 145, 255, 0.55);
            border-radius: 32px;
            background: #071126;
            box-shadow: 0 12px 50px rgba(0, 97, 255, 0.25);

            h2 {
                margin: 0;
                font-size: 32px;
                line-height: 45px;
                text-align: center;
            }

            p {
                margin: 16px 0 28px;
                overflow: hidden;
                color: #B8C3D4;
                font-size: 24px;
                line-height: 34px;
                text-align: center;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .mine-remark-field {
                display: flex;
                width: 550px;
                height: 88px;
                padding: 0 24px;
                align-items: center;
                border-radius: 20px;
                background: rgba(255, 255, 255, 0.10);

                input {
                    width: 100%;
                    border: 0;
                    outline: 0;
                    background: transparent;
                    color: #FFFFFF;
                    font-size: 28px;

                    &::placeholder {
                        color: rgba(184, 195, 212, 0.50);
                    }
                }
            }

            .mine-remark-actions {
                margin-top: 36px;
                gap: 20px;

                button {
                    width: 265px;
                    height: 80px;
                    border-radius: 999px;
                    color: #FFFFFF;
                    font-size: 28px;

                    &:disabled {
                        opacity: 0.55;
                    }
                }

                .mine-remark-cancel {
                    background: rgba(255, 255, 255, 0.12);
                }

                .mine-remark-save {
                    background: #1261F3;
                }
            }
        }
    }
}
</style>
