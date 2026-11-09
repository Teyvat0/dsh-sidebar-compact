window.__ModuleLoader__.load({
  id: '@teyvat0/dsh-sidebar-compact',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useLayoutEffect, useRef, useState } = React;

    const NS = 'dsh-sidebar-compact';
    const ATTR = 'data-dsh-sidebar-compact';
    const PANELS_ATTR = 'data-dsh-sidebar-panels';
    const STORAGE_KEY = 'dsh-sidebar-compact.mode';
    const PANELS_KEY = 'dsh-sidebar-compact.panels';
    const COMPACT_WIDTH = 248;

    const DICTS = {
      en: {
        collapse: 'Collapse sidebar',
        expand: 'Expand sidebar',
        compactOn: 'Compact mode: on',
        compactOnHint: 'Click to restore the default width and spacing',
        compactOff: 'Compact mode: off',
        compactOffHint: 'Click to narrow the sidebar and tighten row spacing',
        foldOn: 'Panels folded',
        foldOnHint: 'Click to show the panel names again',
        foldOff: 'Panels expanded',
        foldOffHint: 'Click to fold the panel list into icons and free up height',
        foldedPanelHint: 'Panels are folded — click to open',
      },
      zh: {
        collapse: '收起侧边栏',
        expand: '展开侧边栏',
        compactOn: '紧凑模式：开',
        compactOnHint: '点击恢复默认宽度和行距',
        compactOff: '紧凑模式：关',
        compactOffHint: '点击收窄侧栏并压缩行距',
        foldOn: '面板已折叠',
        foldOnHint: '点击展开面板名称',
        foldOff: '面板已展开',
        foldOffHint: '点击把面板列表折成图标，腾出纵向空间',
        foldedPanelHint: '面板已折叠，点击打开',
      },
    };

    let ctxRef = null;
    let translate = (key) => DICTS.en[key] || key;
    let compact = true;
    let folded = true;
    const listeners = new Set();

    function readStoredMode() {
      try {
        const value = window.localStorage.getItem(STORAGE_KEY);
        if (value === 'off') return false;
        if (value === 'on') return true;
      } catch (error) {}
      return true;
    }

    function readStoredFolded() {
      try {
        const value = window.localStorage.getItem(PANELS_KEY);
        if (value === 'open') return false;
        if (value === 'folded') return true;
      } catch (error) {}
      return true;
    }

    function publish() {
      for (const listener of Array.from(listeners)) {
        try {
          listener();
        } catch (error) {}
      }
    }

    function setCompact(next, persist) {
      compact = !!next;
      if (persist !== false) {
        try {
          window.localStorage.setItem(STORAGE_KEY, compact ? 'on' : 'off');
        } catch (error) {}
      }
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute(ATTR, compact ? 'on' : 'off');
      }
      syncFrameWidth();
      publish();
    }

    function useCompactMode() {
      const [value, setValue] = useState(compact);
      useEffect(() => {
        const listener = () => setValue(compact);
        listeners.add(listener);
        listener();
        return () => {
          listeners.delete(listener);
        };
      }, []);
      return value;
    }

    function setFolded(next, persist) {
      folded = !!next;
      if (persist !== false) {
        try {
          window.localStorage.setItem(PANELS_KEY, folded ? 'folded' : 'open');
        } catch (error) {}
      }
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute(PANELS_ATTR, folded ? 'folded' : 'open');
        if (folded) emitTip(null);
      }
      publish();
    }

    function useFoldedMode() {
      const [value, setValue] = useState(folded);
      useEffect(() => {
        const listener = () => setValue(folded);
        listeners.add(listener);
        listener();
        return () => {
          listeners.delete(listener);
        };
      }, []);
      return value;
    }

    function useLocaleRefresh() {
      const [, bump] = useState(0);
      useEffect(() => {
        const locale = ctxRef && ctxRef.locale;
        if (!locale || typeof locale.subscribe !== 'function') return undefined;
        let off = null;
        try {
          off = locale.subscribe(() => bump((tick) => tick + 1));
        } catch (error) {}
        return () => {
          try {
            if (typeof off === 'function') off();
          } catch (error) {}
        };
      }, []);
    }

    function SidebarGlyph(props) {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: 16,
          height: 16,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.25,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: false,
        },
        h('rect', { x: 1.75, y: 2.75, width: 12.5, height: 10.5, rx: 2 }),
        h('line', { x1: 6.5, y1: 3.25, x2: 6.5, y2: 12.75 }),
        props.collapsed
          ? h('path', { d: 'M9.25 6.5 10.75 8l-1.5 1.5' })
          : h('path', { d: 'M10.75 6.5 9.25 8l1.5 1.5' }),
      );
    }

    function CompactGlyph() {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: 16,
          height: 16,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.25,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: false,
        },
        h('path', { d: 'M2.5 8h3.5' }),
        h('path', { d: 'M4.5 6.25 6.25 8 4.5 9.75' }),
        h('path', { d: 'M13.5 8H10' }),
        h('path', { d: 'M11.5 6.25 9.75 8l1.75 1.75' }),
      );
    }

    function FoldGlyph(props) {
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: 16,
          height: 16,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.25,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: false,
        },
        h('path', { d: 'M2.75 3.5h10.5' }),
        h('path', { d: 'M2.75 6.75h10.5' }),
        props.folded
          ? h('path', { d: 'M5.5 10.25 8 12.75l2.5-2.5' })
          : h('path', { d: 'M5.5 12.75 8 10.25l2.5 2.5' }),
      );
    }

    // Self-drawn tooltip state. The native `title` tooltip is anchored at the
    // pointer and gets clipped near the window edge, so the plugin renders its
    // own bubble inside the shell overlay layer and clamps it to the frame.
    let overlayReady = false;
    let tipState = null;
    const tipListeners = new Set();

    function emitTip(next) {
      tipState = next;
      for (const listener of Array.from(tipListeners)) {
        try {
          listener();
        } catch (error) {}
      }
    }

    function SidebarTip() {
      const [tip, setTip] = useState(tipState);
      const [position, setPosition] = useState(null);
      const boxRef = useRef(null);
      useEffect(() => {
        const listener = () => setTip(tipState);
        tipListeners.add(listener);
        return () => {
          tipListeners.delete(listener);
        };
      }, []);
      useLayoutEffect(() => {
        const box = boxRef.current;
        if (!tip || !box) {
          setPosition(null);
          return;
        }
        const layer = box.offsetParent || box.parentElement;
        if (!layer) return;
        const bounds = layer.getBoundingClientRect();
        const width = box.offsetWidth;
        const height = box.offsetHeight;
        const left = Math.max(8, Math.min(tip.left - bounds.left, bounds.width - width - 8));
        let top = tip.top - bounds.top - height - 8;
        if (top < 8) top = tip.top - bounds.top + tip.height + 8;
        setPosition({ left, top });
      }, [tip]);
      if (!tip) return null;
      const style = position
        ? { left: position.left + 'px', top: position.top + 'px' }
        : { left: 0, top: 0, visibility: 'hidden' };
      return h(
        'div',
        { ref: boxRef, className: 'dsc-tip', role: 'tooltip', style },
        h('div', { className: 'dsc-tip-title' }, tip.title),
        tip.hint ? h('div', { className: 'dsc-tip-hint' }, tip.hint) : null,
      );
    }

    function ActionButton(props) {
      const [pressed, setPressed] = useState(false);
      const timer = useRef(null);
      useEffect(
        () => () => {
          if (timer.current) window.clearTimeout(timer.current);
          if (pressed) emitTip(null);
        },
        [],
      );
      const show = (element) => {
        if (!element || !props.tip) return;
        if (timer.current) window.clearTimeout(timer.current);
        const rect = element.getBoundingClientRect();
        timer.current = window.setTimeout(() => {
          emitTip({
            title: props.tip.title,
            hint: props.tip.hint,
            left: rect.left,
            top: rect.top,
            height: rect.height,
          });
        }, 350);
      };
      const hide = () => {
        if (timer.current) {
          window.clearTimeout(timer.current);
          timer.current = null;
        }
        emitTip(null);
      };
      const classes = ['dsc-btn'];
      if (props.rail) classes.push('dsc-btn-rail');
      if (props.active) classes.push('dsc-btn-active');
      const label = props.tip ? [props.tip.title, props.tip.hint].filter(Boolean).join(' — ') : undefined;
      return h(
        'button',
        {
          type: 'button',
          className: classes.join(' '),
          title: !overlayReady && props.tip ? label : undefined,
          'aria-label': label,
          'aria-pressed': props.active === undefined ? undefined : !!props.active,
          onClick: (event) => {
            hide();
            if (typeof props.onClick === 'function') props.onClick(event);
          },
          onMouseEnter: (event) => show(event.currentTarget),
          onMouseLeave: hide,
          onFocus: (event) => {
            setPressed(true);
            show(event.currentTarget);
          },
          onBlur: () => {
            setPressed(false);
            hide();
          },
        },
        props.children,
      );
    }

    function SidebarFooterActions(props) {
      useLocaleRefresh();
      const compactOn = useCompactMode();
      const foldedOn = useFoldedMode();
      const rail = props.wide === false;
      const toggleTip = { title: translate(rail ? 'expand' : 'collapse') };
      const compactTip = compactOn
        ? { title: translate('compactOn'), hint: translate('compactOnHint') }
        : { title: translate('compactOff'), hint: translate('compactOffHint') };
      const foldTip = foldedOn
        ? { title: translate('foldOn'), hint: translate('foldOnHint') }
        : { title: translate('foldOff'), hint: translate('foldOffHint') };
      const buttons = [
        h(
          ActionButton,
          {
            key: 'toggle',
            rail,
            tip: toggleTip,
            onClick: () => ctxRef.layout.toggleSidebar(),
          },
          h(SidebarGlyph, { collapsed: rail }),
        ),
      ];
      if (!rail) {
        buttons.push(
          h(
            ActionButton,
            {
              key: 'compact',
              active: compactOn,
              tip: compactTip,
              onClick: () => setCompact(!compactOn),
            },
            h(CompactGlyph, null),
          ),
        );
        buttons.push(
          h(
            ActionButton,
            {
              key: 'fold',
              active: foldedOn,
              tip: foldTip,
              onClick: () => setFolded(!foldedOn),
            },
            h(FoldGlyph, { folded: foldedOn }),
          ),
        );
      }
      return h('div', { className: rail ? 'dsc-actions dsc-actions-rail' : 'dsc-actions' }, buttons);
    }

    // The shell renders its three grid tracks as one inline style value, and a
    // CSS override would have to guess the width of an open right panel. So
    // rewrite only the leading sidebar track and hand the original value back
    // when the sidebar is collapsed, drawer mode is on, or compact mode is off.
    let frameNaturalWidth = null;

    function frameElement() {
      if (typeof document === 'undefined') return null;
      return document.querySelector('div[class*="_frame"][style*="grid-template-columns"]');
    }

    function syncFrameWidth() {
      const frame = frameElement();
      if (!frame) return;
      const css = frame.style.gridTemplateColumns;
      if (!css) return;
      const match = /^\s*([\d.]+)px/.exec(css);
      if (!match) return;
      const current = parseFloat(match[1]);
      if (frame.hasAttribute('data-dragging')) return;
      const blocked =
        !compact ||
        frame.hasAttribute('data-sidebar-collapsed') ||
        frame.hasAttribute('data-sidebar-drawer');
      if (blocked) {
        if (frameNaturalWidth !== null && current === COMPACT_WIDTH) {
          frame.style.gridTemplateColumns = css.replace(/^\s*[\d.]+px/, frameNaturalWidth + 'px');
        }
        frameNaturalWidth = null;
        return;
      }
      if (current === COMPACT_WIDTH) return;
      frameNaturalWidth = current;
      frame.style.gridTemplateColumns = css.replace(/^\s*[\d.]+px/, COMPACT_WIDTH + 'px');
    }

    // Density, folding and the label centering are pure descendant styling, so
    // width itself is handled in JS (see syncFrameWidth) because the shell
    // writes the grid tracks inline and an open right panel must keep its size.
    const SIDEBAR = ' [class*="_sidebarCol"] [class*="_root"]:not([class*="_collapsed"])';
    const SCOPE = 'html[' + ATTR + '="on"]' + SIDEBAR;
    // Centering the new-session label is a fix of its own, so it also applies
    // while compact mode is off.
    const EXPANDED = 'html' + SIDEBAR;
    const FOLD_SCOPE = 'html[' + PANELS_ATTR + '="folded"]' + SIDEBAR;

    const CSS = [
      '.dsc-actions{display:flex;align-items:center;justify-content:flex-end;gap:2px;flex:none;min-width:0}',
      '.dsc-actions-rail{justify-content:center}',
      '.dsc-btn{display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;width:28px;height:28px;padding:0;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;flex:none}',
      '@media (hover:hover){.dsc-btn:hover{background-color:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}}',
      '.dsc-btn:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}',
      '.dsc-btn-active{background-color:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.dsc-btn-rail{width:36px;height:36px;border-radius:var(--dsw-radius-md);color:var(--dsw-alias-label-primary)}',
      '',
      '/* self-drawn tooltip inside the shell overlay layer, clamped to the frame */',
      '.dsc-tip{position:absolute;box-sizing:border-box;z-index:2;max-width:min(224px,calc(100% - 16px));padding:7px 10px;border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-bg-elevated,#2f2f33);border:.5px solid var(--dsw-alias-border-l3,rgba(255,255,255,.16));box-shadow:0 6px 18px rgba(0,0,0,.32);color:var(--dsw-alias-label-primary);font-size:12px;line-height:16px;pointer-events:none !important;white-space:normal;word-break:break-word}',
      '.dsc-tip-title{font-weight:500}',
      '.dsc-tip-hint{margin-top:2px;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:15px}',
      '',
      '/* compact density: only while the sidebar is expanded */',
      SCOPE + ' [class*="_panelRow"]{min-height:32px;padding-top:5px;padding-bottom:5px}',
      SCOPE + ' [class*="_panelList"]{gap:1px;margin-bottom:6px}',
      // `button` matters: a bare [class*="_newSession"] also matches
      // _newSessionContent / LabelMask / Label and drags them out of center.
      SCOPE + ' button[class*="_newSession"]{height:34px;margin-bottom:8px;padding-top:6px;padding-bottom:6px;line-height:20px}',
      'html[' + ATTR + '="on"]:not([data-windows-titlebar]) [class*="_sidebarCol"] [class*="_root"]:not([class*="_collapsed"]) [class*="_logoRow"]{height:50px}',
      'html[' + ATTR + '="on"]:not([data-windows-titlebar]) [class*="_sidebarCol"] [class*="_root"]:not([class*="_collapsed"]) [class*="_topStrip"]{height:44px}',
      '',
      '/* compact width: the shell keeps its width state inline on the sidebar root,',
      '   so narrow that node here; the grid track is rewritten in syncFrameWidth',
      '   so an open right panel keeps its own size */',
      'html[' + ATTR + '="on"] [class*="_sidebarCol"] [class*="_root"][style*="width"]:not([class*="_collapsed"]){width:' + COMPACT_WIDTH + 'px !important;max-width:' + COMPACT_WIDTH + 'px !important}',
      '',
      '/* the host centers the icon+label group, which leaves the words half an',
      '   icon right of the optical center; padding the content on the right',
      '   pulls the group left by exactly that half so the words sit centered */',
      EXPANDED + ' [class*="_newSessionContent"]{padding-right:24px}',
      '',
      '/* folded panel list: one compact icon grid instead of ten labelled rows */',
      FOLD_SCOPE + ' [class*="_panelList"]{flex-direction:row;flex-wrap:wrap;gap:4px;margin-bottom:8px}',
      FOLD_SCOPE + ' [class*="_panelList"]>*{flex:none}',
      FOLD_SCOPE + ' [class*="_panelList"] [class*="_panelRow"]{width:34px;min-width:34px;min-height:34px;padding:0;gap:0;justify-content:center;align-items:center;border-inline-width:0;border-radius:var(--dsw-radius-md)}',
      FOLD_SCOPE + ' [class*="_panelList"] [class*="_moreAnchor"]{width:34px;flex:none}',
      FOLD_SCOPE + ' [class*="_panelList"] [class*="_panelRow"] [class*="_panelTitle"]{display:none}',
    ].join('\n');

    return {
      inject: ['slots', 'layout', 'locale'],
      apply(ctx) {
        ctxRef = ctx;
        const use = (callback) => {
          if (typeof ctx.effect === 'function') return ctx.effect(callback);
          return callback();
        };

        if (ctx.locale) {
          try {
            use(() => ctx.locale.register(NS, 'en', DICTS.en));
          } catch (error) {
            console.error('[dsh-sidebar-compact] failed to register en locale', error);
          }
          try {
            use(() => ctx.locale.register(NS, 'zh', DICTS.zh));
          } catch (error) {
            console.error('[dsh-sidebar-compact] failed to register zh locale', error);
          }
          try {
            const bound = ctx.locale.bind(NS);
            if (typeof bound === 'function') translate = bound;
          } catch (error) {
            console.error('[dsh-sidebar-compact] failed to bind locale', error);
          }
        }

        use(() => {
          const tag = document.createElement('style');
          tag.setAttribute('data-plugin', '@teyvat0/dsh-sidebar-compact');
          tag.textContent = CSS;
          document.head.appendChild(tag);
          return () => tag.remove();
        });

        compact = readStoredMode();
        setCompact(compact, false);
        folded = readStoredFolded();
        setFolded(folded, false);
        use(() => () => {
          if (typeof document !== 'undefined') {
            document.documentElement.removeAttribute(ATTR);
            document.documentElement.removeAttribute(PANELS_ATTR);
          }
          listeners.clear();
        });

        // While the panel list is folded the shipped rows render as bare icons:
        // the host disables its own Tooltip in wide mode, so surface the row
        // label through our overlay bubble instead of a native title tooltip.
        use(() => {
          const expandedRow = (node) => {
            if (!(node instanceof Element)) return null;
            const row = node.closest('[class*="_panelRow"][aria-label]');
            if (!row) return null;
            const list = row.closest('[class*="_panelList"]');
            if (!list) return null;
            const root = row.closest('[class*="_root"]');
            if (!root || String(root.className).indexOf('_collapsed') !== -1) return null;
            return row;
          };
          const onOver = (event) => {
            if (!folded || !overlayReady) return;
            const row = expandedRow(event.target);
            if (!row) return;
            const rect = row.getBoundingClientRect();
            emitTip({
              title: row.getAttribute('aria-label') || '',
              hint: translate('foldedPanelHint'),
              left: rect.left,
              top: rect.top,
              height: rect.height,
            });
          };
          const onOut = (event) => {
            if (!folded) return;
            const next = event.relatedTarget;
            if (next instanceof Element && next.closest('[class*="_panelRow"]')) return;
            emitTip(null);
          };
          document.addEventListener('mouseover', onOver, true);
          document.addEventListener('mouseout', onOut, true);
          return () => {
            document.removeEventListener('mouseover', onOver, true);
            document.removeEventListener('mouseout', onOut, true);
            emitTip(null);
          };
        });

        ctx.slots.inject('sidebar.footer.action', () =>
          ctx.slots.register(
            {
              name: 'sidebar.footer.action',
              id: 'dsh-sidebar-compact',
              order: 120,
            },
            SidebarFooterActions,
          ),
        );

        // The overlay layer sits above every column and outside their scroll
        // containers, so the bubble can never be clipped by the sidebar.
        try {
          ctx.slots.inject('shell.overlay', () =>
            ctx.slots.register(
              {
                name: 'shell.overlay',
                id: 'dsh-sidebar-compact-tip',
                order: 40,
              },
              SidebarTip,
            ),
          );
          overlayReady = true;
        } catch (error) {
          console.error('[dsh-sidebar-compact] shell.overlay unavailable, falling back to title', error);
        }
      },
    };
  },
});
