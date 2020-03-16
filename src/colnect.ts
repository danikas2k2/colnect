// ==UserScript==
// @name         collector :: colnect.com
// @namespace    https://colnect.com/
// @version      [AIV]{version}[/AIV]
// @author       danikas2k2
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB6UlEQVQ4jdWSTUhUcRTFf/c/b8ZyMUW5qhZF1MaNZF8qge2siGxR29o48wZ1EW1bqGCt2hTWvCGKaNenEFgEIwXiWKK7FhEtMoQKtbSEGN/8T4sUxI82rbqrC+eewzmHC//92NJSn4lqkk7dDk56eD6SDzMAxzqvVX2Lqy46dE5il8Fnj574RKXnTV/HdADQlM3v96anQFow64w0QO2Z+6nvCzMvQJtkPAK9kiw27EKiEpSOdN5uChoz0W5vKoJNWmLh8HBf+0RzV3cCIL11OgO23bBbeI2Wolzxj18NNoaF/jguX3FyugykMcsN93V8BNPLrq54MWGrsHsmzZWisLgsubzZdROnHNACaMfU5qE1Oqp28BPTw1VIRT8E1cFikTZRM1UHjAEcbCvstSDegGdIpuOlfO7qqvadb0U2ZA1h/jFwGmPexLDENoxamZ1PBsmBeKE8DtZf9lwaK2Rn6zNRMmkKzeiVt2ZnKAQ9Q2wUqsPxzokTIzezdxX/ihED4PelnL40hPkPKacZM9pwrmWkkB23ldaW/UV1KqFBRF3sKnsC77xgp2RfX0fh+6W7YG26LOWiO4hDGD2jN9o/LQKTKy/dWvTGMH8U44BhY3NTW3rXc7mugHBNJhUrsWt9++Bs+W8C/zy/AT3Myy3qczVrAAAAAElFTkSuQmCC
// @downloadURL  https://raw.githubusercontent.com/danikas2k2/tampermonkey-colnect/master/dist/colnect.user.js
// @updateURL    https://raw.githubusercontent.com/danikas2k2/tampermonkey-colnect/master/dist/colnect.user.js
// @match        https://*.colnect.com/*/coins/*
// @match        https://*.colnect.com/*/banknotes/*
// @match        https://*.colnect.com/*/stamps/*
// @match        https://*.colnect.com/*/medals/*
// @match        https://*.colnect.com/*/tokens/*
// @run-at       document-end
// ==/UserScript==

declare const $: JQueryStatic;

// @ts-ignore
import style from '../styles/colnect.less';

$('head').append(`<style type="text/css">${style}</style>`);

declare const Inventory: {
    updateQC: (e: JQuery.ClickEvent, n: HTMLElement) => {};
    spanCBup: (n: HTMLElement) => {};
};

const loc = document.location.href;

const type = (loc => {
    if (loc.includes('/coins/')) {
        return 'coins';
    }
    if (loc.includes('/banknotes/')) {
        return 'banknotes';
    }
    if (loc.includes('/stamps/')) {
        return 'stamps';
    }
    if (loc.includes('/medals/')) {
        return 'medals';
    }
    if (loc.includes('/tokens/')) {
        return 'tokens';
    }
    return 'other';
})(loc);

$('body').addClass(type);


const itemFullDetails = $('#item_full_details');
const itemCondition = $(`> .ibox > .ibox_list[data-lt="2"] .pop.condition`, itemFullDetails);

const {updateQC: _updateQC, spanCBup: _spanCBup} = Inventory;

if (type === 'coins' && loc.includes('/coin/')) {
    const itemYearVariants = $(`> .year_variants > ul > li[data-id]`, itemFullDetails);

    let currentPopCondition: JQuery;

    const mouseOverCondition = (li: JQuery) => {
        const popCondition = $('.ibox_list[data-lt="2"] > .pop.condition', li);
        if (popCondition) {
            popCondition.trigger('mouseover');
        }
        return popCondition;
    };

    // clicking on year row
    itemYearVariants.each((i, itemYearVariant) => {
        $(itemYearVariant).on('click', e => {
            currentPopCondition = mouseOverCondition($(e.currentTarget));
        });
    });


    const _q: { [key: string]: number } = {P: 1, FA: 2, G: 3, VG: 4, FI: 5, VF: 6, XF: 7, UNC: 8, BU: 9, FDC: 10};

    const q = (s: string) => (s && s in _q) ? _q[s] : 0;


    //

    const qualityList = $('#quality_list');

    const updateOverallCondition = (e: JQuery.ClickEvent, current: number) => {
        const variants: number[] = [];

        itemYearVariants.each((i, n) => {
            const qn = $('ul.oth_inv', n).text().split(':', 2).pop().trim();
            variants.push(n.classList.contains('open')
                ? current
                : q(qn));
        });

        const best = Math.max(...variants);
        if (best && best !== q(itemCondition.text())) {
            itemCondition.trigger('mouseover');
            _updateQC(e, $(`#quality_list a[data-value="${best}"]`, itemCondition)[0]);
            if (currentPopCondition && currentPopCondition.length) {
                currentPopCondition.trigger('mouseover');
            } else {
                itemCondition.trigger('mouseout');
            }
        }
    };

    Inventory.updateQC = (e: JQuery.ClickEvent, n: HTMLElement) => {
        const _r = _updateQC(e, n);
        updateOverallCondition(e, +$('a[data-value]', n).data('value'));
        return _r;
    };

    Inventory.spanCBup = (n: HTMLElement) => {
        const _r = _spanCBup(n);
        if (n.classList.contains('cb_checked')) {
            // @ts-ignore
            updateOverallCondition(event, 0, null);
        } else {
            itemCondition.trigger('mouseover');
        }
        return _r;
    };

    $('li', qualityList)
        .off('click')
        .on('click', e => Inventory.updateQC(e, e.currentTarget));
} else {
    Inventory.spanCBup = (n: HTMLElement) => {
        const _r = _spanCBup(n);

        if (!n.classList.contains('cb_checked')) {
            itemCondition.trigger('mouseover');
        }

        return _r;
    };
}
