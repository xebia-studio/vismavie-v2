import {wording, sharingKnowledgeItems} from '../../constants/values.constants.js';

export default class OurValuesCtrl {
  constructor($sce) {
    this.$sce = $sce;

    this.showCaseTitle = 'Nos valeurs';
    this.showCaseMainDescription = 'Je suis chez Xebia pour les valeurs';
    this.wording = wording;
    this.sharingKnowledgeItems = sharingKnowledgeItems;
  }

  trustSrc(src){
    return this.$sce.trustAsResourceUrl(src);
  }

}

OurValuesCtrl.$inject = ['$sce'];