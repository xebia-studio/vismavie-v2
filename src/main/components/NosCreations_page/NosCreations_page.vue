<template lang="jade">
  AppSimplePage.NosCreations_page(:header="header")
      CallToActionLayer(ref="inHeader", slot='inHeader')

      AppSection.AppSection-even(:title="partagerConnaissance.name", :baseline="partagerBaseline")
        PartagerConnaissance(:statCards="partagerConnaissance.data", slot="section-content")
      AppSection.AppSection-even(:title="projetsVaries.name")
        CardSlider(slot="section-content", :cards="projetsVaries.data")
</template>

<script>
import AppSimplePage from 'components/AppSimplePage';
import CallToActionLayer from 'components/CallToActionLayer'

import header from 'data/nos-creations/header.json';

import AppSection from 'components/AppSection';

import PartagerConnaissance from 'components/PartagerConnaissance';
import partagerConnaissance from 'data/nos-creations/partager-connaissance.json';

import CardSlider from 'components/CardSlider';
import projetsVaries from 'data/nos-creations/projets-varies.json';

import { mixin as fontLoader } from 'tools/font-loader';

import headerImageCacheSetter from 'generated/tools/components/NosCreations_page/blurryHeaderImageCacheSetter';

export default {
    name: 'NosCreations_page',
    mixins: [fontLoader],
    data: function () {
        return {
            header: Object.assign({}, header, {
                imageCacheSetter: headerImageCacheSetter
            }),
            partagerBaseline: 'Écrire, enseigner, construire, manager... Les contributions internes sont nombreuses et chacun a la possibilité de participer en fonction de ses savoir-faire et savoir-être !',
            partagerConnaissance,
            projetsVaries
        };
    },
    created: function () {
            this.loadFont({
                'text': ['light', 'regular'],
            });
    },
    components: {
        AppSimplePage,
        CallToActionLayer,
        AppSection,
        PartagerConnaissance,
        CardSlider
    }
};
</script>
