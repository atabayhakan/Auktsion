// src/composables/useCountdown.ts
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'

export interface CountdownOptions {
  endsAt: string | Date | null | undefined
  onTick?: (remaining: CountdownResult) => void
  onEnd?: () => void
  warningThresholdMs?: number
  criticalThresholdMs?: number
}

export interface CountdownResult {
  total: number
  days: number
  hours: number
  minutes: number
  seconds: number
  milliseconds: number
  isEnded: boolean
  isWarning: boolean
  isCritical: boolean
  formatted: string
  formattedShort: string
  formattedCompact: string
}

export function useCountdown(options: CountdownOptions) {
  const {
    endsAt,
    onTick,
    onEnd,
    warningThresholdMs = 3600000,
    criticalThresholdMs = 300000,
  } = options

  const { t } = useI18n()

  const remaining = ref<number>(0)
  const isActive = ref<boolean>(false)
  let intervalId: number | null = null
  let rafId: number | null = null

  const endTime = computed(() => {
    if (!endsAt) return null
    const date = typeof endsAt === 'string' ? new Date(endsAt) : endsAt
    return date ? date.getTime() : null
  })

  function calculateRemaining(): CountdownResult {
    if (!endTime.value) {
      return zeroResult()
    }

    const now = Date.now()
    const total = Math.max(0, endTime.value - now)

    if (total <= 0) {
      const endStr = t('time.ended') !== 'time.ended' ? t('time.ended') : 'Аяктады'
      return {
        total: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
        isEnded: true,
        isWarning: false,
        isCritical: false,
        formatted: endStr,
        formattedShort: endStr,
        formattedCompact: '00:00:00',
      }
    }

    const days = Math.floor(total / (1000 * 60 * 60 * 24))
    const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((total % (1000 * 60)) / 1000)
    const milliseconds = total % 1000

    const isWarning = total <= warningThresholdMs
    const isCritical = total <= criticalThresholdMs

    const daysUnit = t('common.days') !== 'common.days' ? t('common.days') : 'күн'
    const hoursUnit = t('common.hours') !== 'common.hours' ? t('common.hours') : 'саат'
    const minUnit = t('common.minutes') !== 'common.minutes' ? t('common.minutes') : 'мин'
    const secUnit = t('common.seconds') !== 'common.seconds' ? t('common.seconds') : 'сек'

    let formatted = ''
    let formattedShort = ''
    let formattedCompact = ''

    if (days > 0) {
      formatted = days + ' ' + daysUnit + ' ' + hours + ' ' + hoursUnit
      formattedShort = days + (t('time.shortDays') !== 'time.shortDays' ? t('time.shortDays') : 'к') + ' ' + hours + (t('time.shortHours') !== 'time.shortHours' ? t('time.shortHours') : 'с')
      formattedCompact = days + 'd ' + hours + 'h'
    } else if (hours > 0) {
      formatted = hours + ' ' + hoursUnit + ' ' + minutes + ' ' + minUnit
      formattedShort = hours + ':' + minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0')
      formattedCompact = hours + 'h ' + minutes + 'm'
    } else if (minutes > 0) {
      formatted = minutes + ' ' + minUnit + ' ' + seconds + ' ' + secUnit
      formattedShort = minutes + ':' + seconds.toString().padStart(2, '0')
      formattedCompact = minutes + 'm ' + seconds + 's'
    } else {
      formatted = seconds + ' ' + secUnit
      formattedShort = seconds + (t('time.shortSeconds') !== 'time.shortSeconds' ? t('time.shortSeconds') : 'с')
      formattedCompact = seconds + 's'
    }

    return {
      total,
      days,
      hours,
      minutes,
      seconds,
      milliseconds,
      isEnded: false,
      isWarning,
      isCritical,
      formatted,
      formattedShort,
      formattedCompact,
    }
  }

  function zeroResult(): CountdownResult {
    const endStr = t('time.ended') !== 'time.ended' ? t('time.ended') : 'Аяктады'
    return {
      total: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
      isEnded: true,
      isWarning: false,
      isCritical: false,
      formatted: endStr,
      formattedShort: endStr,
      formattedCompact: '00:00:00',
    }
  }

  const countdown = computed(() => calculateRemaining())

  function start() {
    if (isActive.value) return
    
    if (!endTime.value || endTime.value <= Date.now()) {
      remaining.value = 0
      isActive.value = false
      return
    }

    isActive.value = true
    remaining.value = endTime.value - Date.now()

    function tick() {
      if (!isActive.value) return

      const now = Date.now()
      remaining.value = endTime.value! - now

      if (remaining.value <= 0) {
        stop()
        onEnd?.()
        return
      }

      const result = countdown.value
      onTick?.(result)

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
  }

  function stop() {
    isActive.value = false
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function reset(_newEndsAt?: string | Date) {
    stop()
    start()
  }


  function pause() {
    stop()
  }

  function resume() {
    start()
  }

  watch(endTime, (newEnd) => {
    if (newEnd) {
      start()
    } else {
      stop()
    }
  }, { immediate: true })

  onUnmounted(() => {
    stop()
  })

  onMounted(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pause()
      } else {
        resume()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  })

  return {
    countdown,
    isActive,
    remaining,
    start,
    stop,
    reset,
    pause,
    resume,
  }
}

export function useCountdownFormat(endsAt: string | Date | null) {
  const { countdown } = useCountdown({ endsAt })
  return countdown
}
