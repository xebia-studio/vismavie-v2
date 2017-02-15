<template lang="jade">
    .FAQ
        .FAQ-left-part
        .FAQ-themes
            .FAQ-theme(v-bind:class="{active: isThemeActive(theme)}" v-for="(questions, theme, index) in themes", :style="themeStyle[theme]", ref="theme", v-on:click="selectTheme(theme)")
                .FAQ-theme-title-number(v-if="!isWidthCompact", :is="svgComponent('BulletTransparentWhite' + (index + 1))")
                .FAQ-theme-title
                    .FAQ-theme-title-label(v-html="theme")
                    .FAQ-theme-title-picto(:is="svgComponent(isThemeActive(theme) ? 'IconCircledArrowUp' : 'IconCircledArrowDown')")
                .FAQ-theme-questions
                    .FAQ-theme-question(v-for="question in questions")
                        .FAQ-theme-question-title(v-html="question.title")
                        .FAQ-theme-question-body(v-html="question.answer")
            CTAButton.FAQ-question-button(:label="questionButtonLabel", :link="'mailto:recrutement@xebia.fr'", :newTab="false", :type="'primary'")
</template>

<script>
  import { nextTick } from 'vue';
  import _ from 'lodash';
  import { domHeight } from '@alexistessier/dom';

  import CTAButton from 'components/CTAButton/CTAButton';

  import { mixin as fontLoader } from 'tools/font-loader';
  import { mixin as svgComponent } from 'tools/svg-component';
  import { mixin as sizeClassHelper } from 'tools/size-class-helper';
  import { mixin as scrollController } from 'tools/scroll-controller';

  import animatedScrollTo from 'xebia-web-common/tools/animated-scroll-to';
  import centralEventBus from 'xebia-web-common/tools/central-event-bus';

  export default {
    name: 'FAQ',
    mixins: [fontLoader, svgComponent, sizeClassHelper, scrollController],
    props: {
      themes: {
        type: Object,
        required: true
      },
      questionButtonLabel: {
        type: String,
        required: true
      }
    },
    data: function () {
      return {
        isWidthCompact: this.getSizeClassHelper().isActive('width-compact'),
        themeStyle: _.mapValues(this.themes, () => undefined),
        selectedThemeLabel: _.keys(this.themes)[0]
      };
    },
    methods: {
      isThemeActive: function (themeLabel) {
        return _.isEqual(themeLabel, this.selectedThemeLabel);
      },
      selectTheme: function (themeLabel) {
        this.selectedThemeLabel = themeLabel;
      },
      updateLayoutOnResize: function () {
        const temporaryThemeStyle = {};
        _.keys(this.themes).forEach((themeLabel) => {
          this.themeStyle[themeLabel] = {height: 'auto'};
        });
        nextTick(() => {
          if(this.$refs.theme) {
            _.keys(this.themes).forEach((themeLabel, index) => {
              temporaryThemeStyle[themeLabel] = {height: domHeight(this.$refs.theme[index])+'px'};
              this.themeStyle = _.mapValues(this.themes, () => {return {height: undefined};});
            });
          }
          requestAnimationFrame(() => {
            this.themeStyle = temporaryThemeStyle;
          });
        });
      }
    },
    computed: {
      selectedThemeIndex: function () {
        const selectedThemeIndex = -1;
        for(const themeLabel in this.themes) {
          if(this.isThemeActive(themeLabel)) {
            return _.indexOf(_.keys(this.themes), themeLabel);
          }
        }
        return selectedThemeIndex;
      }
    },
    created: function () {
      this.loadFont({
        'text': ['light', 'regular', 'bold'],
        'title': ['light', 'bold']
      });
      this.getSizeClassHelper().on('resize', () => {
        this.isWidthCompact = this.getSizeClassHelper().isActive('width-compact');
      });
      const resize = () => {
        this.updateLayoutOnResize();
      };
      this.resizeListenerArguments = ['change', resize];
      this.getSizeClassHelper().on(...this.resizeListenerArguments);
    },
    mounted: function () {
      this.updateLayoutOnResize();
    },
    watch: {
      selectedThemeLabel: function(to, from) {
        if(!_.isEqual(to, from)) {
          this.updateLayoutOnResize();
        }
        nextTick(() => {
          requestAnimationFrame(() => {
            centralEventBus.$emit('force-hide-parallaxed-layer', 'navigation-bar');
            let heightToAdd = 0;
            this.$refs.theme.slice(0, this.selectedThemeIndex).forEach((themeElement) => {
              heightToAdd += domHeight(themeElement)+20;
            });
            animatedScrollTo(this.getScrollController().nodePosition(this.$refs.theme[0]) + heightToAdd);
          });
        });
      }
    },
    beforeDestroy: function () {
      this.getSizeClassHelper().off(...this.resizeListenerArguments);
    },
    components: {
      CTAButton
    }
  };
</script>

<style lang="stylus" src="./FAQ.styl"></style>