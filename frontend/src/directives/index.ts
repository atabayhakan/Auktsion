import type { App } from 'vue'

// v-focus directive
export const vFocus = {
  mounted(el: HTMLElement) {
    el.focus()
  },
}

// v-click-outside directive
export const vClickOutside = {
  mounted(el: HTMLElement, binding: { value: (event: Event) => void }) {
    el._clickOutside = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el: HTMLElement) {
    if (el._clickOutside) {
      document.removeEventListener('click', el._clickOutside)
    }
  },

}

// v-intersect directive
export const vIntersect = {
  mounted(el: HTMLElement, binding: { value: IntersectionObserverCallback; arg?: string }) {
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    }
    
    if (binding.arg) {
      const margins = binding.arg.split(',').map(Number)
      if (margins.length === 4) {
        options.rootMargin = `${margins[0]}px ${margins[1]}px ${margins[2]}px ${margins[3]}px`
      }
    }
    
    const observer = new IntersectionObserver(binding.value, options)
    observer.observe(el)
    el._intersectObserver = observer
  },
  unmounted(el: HTMLElement) {
    if (el._intersectObserver) {
      el._intersectObserver.disconnect()
    }
  },
}

// v-ripple directive
export const vRipple = {
  mounted(el: HTMLElement) {
    el.style.position = 'relative'
    el.style.overflow = 'hidden'
    
    el._ripple = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      const ripple = document.createElement('span')
      ripple.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: currentColor;
        opacity: 0.3;
        transform: translate(-50%, -50%);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      `
      
      el.appendChild(ripple)
      
      const maxDimension = Math.max(rect.width, rect.height)
      ripple.style.width = `${maxDimension * 2}px`
      ripple.style.height = `${maxDimension * 2}px`
      
      setTimeout(() => {
        ripple.remove()
      }, 600)
    }
    
    el.addEventListener('click', el._ripple)
  },
  unmounted(el: HTMLElement) {
    if (el._ripple) {
      el.removeEventListener('click', el._ripple)
    }
  },
}

// v-tooltip directive
export const vTooltip = {
  mounted(el: HTMLElement, binding: { value: string; arg?: string }) {
    const tooltip = document.createElement('div')
    tooltip.textContent = binding.value
    tooltip.style.cssText = `
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 12px;
      background: rgba(15, 23, 42, 0.95);
      color: white;
      font-size: 12px;
      border-radius: 6px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
      z-index: 1000;
      margin-bottom: 8px;
    `
    
    if (binding.arg) {
      // Custom position
      const [vertical] = binding.arg.split('-')
      if (vertical === 'top') {
        tooltip.style.bottom = '100%'
        tooltip.style.top = 'auto'
      }
    }
    
    tooltip.style.setProperty('--tooltip-arrow', 'bottom')
    tooltip.style.setProperty('--arrow-size', '6px')
    
    el.style.position = 'relative'
    el.appendChild(tooltip)
    el._tooltip = tooltip
    
    el.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1'
      tooltip.style.transform = 'translateX(-50%) translateY(-4px)'
    })
    
    el.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0'
      tooltip.style.transform = 'translateX(-50%) translateY(0)'
    })
  },
  unmounted(el: HTMLElement) {
    if (el._tooltip) {
      el._tooltip.remove()
    }
  },
}

// v-permission directive (for role-based access)
export const vPermission = {
  mounted(el: HTMLElement, binding: { value: string | string[] }) {
    const permissions = Array.isArray(binding.value) ? binding.value : [binding.value]
    const userPermissions = (el.dataset.permissions || '').split(',').filter(Boolean)
    
    const hasPermission = permissions.some(p => userPermissions.includes(p))
    
    if (!hasPermission) {
      el.style.display = 'none'
      el._permissionHidden = true
    }
  },
  updated(el: HTMLElement, binding: { value: string | string[] }) {
    const permissions = Array.isArray(binding.value) ? binding.value : [binding.value]
    const userPermissions = (el.dataset.permissions || '').split(',').filter(Boolean)
    
    const hasPermission = permissions.some(p => userPermissions.includes(p))
    
    if (!hasPermission && !el._permissionHidden) {
      el.style.display = 'none'
      el._permissionHidden = true
    } else if (hasPermission && el._permissionHidden) {
      el.style.display = ''
      el._permissionHidden = false
    }
  },
}

// v-lazy directive for lazy loading images
export const vLazy = {
  mounted(el: HTMLImageElement, binding: { value: string }) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = binding.value
            img.classList.add('loaded')
            observer.unobserve(img)
          }
        })
      },
      { rootMargin: '50px', threshold: 0.01 }
    )
    
    el._lazyObserver = observer
    observer.observe(el)
  },
  unmounted(el: HTMLImageElement) {
    if (el._lazyObserver) {
      el._lazyObserver.disconnect()
    }
  },
}

// Setup all directives
export function setupDirectives(app: App) {
  app.directive('focus', vFocus)
  app.directive('click-outside', vClickOutside)
  app.directive('intersect', vIntersect)
  app.directive('ripple', vRipple)
  app.directive('tooltip', vTooltip)
  app.directive('permission', vPermission)
  app.directive('lazy', vLazy)
}

export default {
  vFocus,
  vClickOutside,
  vIntersect,
  vRipple,
  vTooltip,
  vPermission,
  vLazy,
  setupDirectives,
}