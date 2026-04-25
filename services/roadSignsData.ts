import type { ImageSourcePropType } from 'react-native';

import type { TrafficQuestion } from './trafficApi';

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

export type RoadSignCategoryId =
  | 'warning'
  | 'priority'
  | 'forbidden'
  | 'special'
  | 'information'
  | 'additional';

export type RoadSignItem = {
  id: string;
  title: string;
  description: string;
  imageUri?: string;
  imageSource?: ImageSourcePropType;
};

export type RoadSignCategory = {
  id: RoadSignCategoryId;
  title: string;
  icon: ImageSourcePropType;
  items: RoadSignItem[];
};

type TemplateItem =
  | {
      kind: 'backend';
      categoryId: RoadSignCategoryId;
      titleKey: string;
      descriptionKey: string;
    }
  | {
      kind: 'local';
      categoryId: RoadSignCategoryId;
      titleKey: string;
      descriptionKey: string;
      imageSource: ImageSourcePropType;
    };

const CATEGORY_META: Record<RoadSignCategoryId, { titleKey: string; icon: ImageSourcePropType }> = {
  warning: {
    titleKey: 'roadsigns.categories.warning',
    icon: require('../assets/ui/road_sign_6.png'),
  },
  priority: {
    titleKey: 'roadsigns.categories.priority',
    icon: require('../assets/ui/road_sign_3.png'),
  },
  forbidden: {
    titleKey: 'roadsigns.categories.forbidden',
    icon: require('../assets/ui/road_sign_2.png'),
  },
  special: {
    titleKey: 'roadsigns.categories.special',
    icon: require('../assets/ui/road_sign_1.png'),
  },
  information: {
    titleKey: 'roadsigns.categories.information',
    icon: require('../assets/ui/road_sign_1.png'),
  },
  additional: {
    titleKey: 'roadsigns.categories.additional',
    icon: require('../assets/ui/road_sign_5.png'),
  },
};

const BACKEND_SIGN_TEMPLATES: TemplateItem[] = [
  {
    kind: 'backend',
    categoryId: 'priority',
    titleKey: 'roadsigns.signs.priorityRoad.title',
    descriptionKey: 'roadsigns.signs.priorityRoad.description',
  },
  {
    kind: 'backend',
    categoryId: 'forbidden',
    titleKey: 'roadsigns.signs.noParking.title',
    descriptionKey: 'roadsigns.signs.noParking.description',
  },
  {
    kind: 'backend',
    categoryId: 'special',
    titleKey: 'roadsigns.signs.directionalTrafficLight.title',
    descriptionKey: 'roadsigns.signs.directionalTrafficLight.description',
  },
  {
    kind: 'backend',
    categoryId: 'warning',
    titleKey: 'roadsigns.signs.roadworks.title',
    descriptionKey: 'roadsigns.signs.roadworks.description',
  },
  {
    kind: 'backend',
    categoryId: 'warning',
    titleKey: 'roadsigns.signs.fallingRocks.title',
    descriptionKey: 'roadsigns.signs.fallingRocks.description',
  },
  {
    kind: 'backend',
    categoryId: 'forbidden',
    titleKey: 'roadsigns.signs.weightLimit.title',
    descriptionKey: 'roadsigns.signs.weightLimit.description',
  },
  {
    kind: 'backend',
    categoryId: 'special',
    titleKey: 'roadsigns.signs.trafficOfficer.title',
    descriptionKey: 'roadsigns.signs.trafficOfficer.description',
  },
  {
    kind: 'backend',
    categoryId: 'special',
    titleKey: 'roadsigns.signs.trafficPolice.title',
    descriptionKey: 'roadsigns.signs.trafficPolice.description',
  },
  {
    kind: 'backend',
    categoryId: 'forbidden',
    titleKey: 'roadsigns.signs.noPedestrians.title',
    descriptionKey: 'roadsigns.signs.noPedestrians.description',
  },
  {
    kind: 'backend',
    categoryId: 'forbidden',
    titleKey: 'roadsigns.signs.noEntry.title',
    descriptionKey: 'roadsigns.signs.noEntry.description',
  },
  {
    kind: 'backend',
    categoryId: 'information',
    titleKey: 'roadsigns.signs.cyclistCrossing.title',
    descriptionKey: 'roadsigns.signs.cyclistCrossing.description',
  },
  {
    kind: 'backend',
    categoryId: 'warning',
    titleKey: 'roadsigns.signs.cattleCrossing.title',
    descriptionKey: 'roadsigns.signs.cattleCrossing.description',
  },
  {
    kind: 'backend',
    categoryId: 'special',
    titleKey: 'roadsigns.signs.manualTrafficControl.title',
    descriptionKey: 'roadsigns.signs.manualTrafficControl.description',
  },
  {
    kind: 'backend',
    categoryId: 'special',
    titleKey: 'roadsigns.signs.policeStop.title',
    descriptionKey: 'roadsigns.signs.policeStop.description',
  },
  {
    kind: 'backend',
    categoryId: 'information',
    titleKey: 'roadsigns.signs.firstAid.title',
    descriptionKey: 'roadsigns.signs.firstAid.description',
  },
  {
    kind: 'backend',
    categoryId: 'forbidden',
    titleKey: 'roadsigns.signs.noLeftTurn.title',
    descriptionKey: 'roadsigns.signs.noLeftTurn.description',
  },
  {
    kind: 'backend',
    categoryId: 'warning',
    titleKey: 'roadsigns.signs.steepDescent.title',
    descriptionKey: 'roadsigns.signs.steepDescent.description',
  },
  {
    kind: 'backend',
    categoryId: 'priority',
    titleKey: 'roadsigns.signs.giveWay.title',
    descriptionKey: 'roadsigns.signs.giveWay.description',
  },
  {
    kind: 'backend',
    categoryId: 'forbidden',
    titleKey: 'roadsigns.signs.noTrucks.title',
    descriptionKey: 'roadsigns.signs.noTrucks.description',
  },
  {
    kind: 'backend',
    categoryId: 'warning',
    titleKey: 'roadsigns.signs.dangerNearWater.title',
    descriptionKey: 'roadsigns.signs.dangerNearWater.description',
  },
  {
    kind: 'local',
    categoryId: 'additional',
    titleKey: 'roadsigns.signs.advanceDirectionPlate.title',
    descriptionKey: 'roadsigns.signs.advanceDirectionPlate.description',
    imageSource: require('../assets/ui/road_sign_4.png'),
  },
  {
    kind: 'local',
    categoryId: 'additional',
    titleKey: 'roadsigns.signs.distancePlate.title',
    descriptionKey: 'roadsigns.signs.distancePlate.description',
    imageSource: require('../assets/ui/road_sign_5.png'),
  },
];

export function buildRoadSignsCatalog(t: Translate, questions: TrafficQuestion[]): RoadSignCategory[] {
  const categories: Record<RoadSignCategoryId, RoadSignItem[]> = {
    warning: [],
    priority: [],
    forbidden: [],
    special: [],
    information: [],
    additional: [],
  };

  let backendIndex = 0;
  for (const template of BACKEND_SIGN_TEMPLATES) {
    if (template.kind === 'backend') {
      const question = questions[backendIndex];
      backendIndex += 1;
      if (!question) continue;
      const imageUri = question.question?.imageURLs?.[0];
      categories[template.categoryId].push({
        id: question._id || `${template.categoryId}-${backendIndex}`,
        title: t(template.titleKey),
        description: t(template.descriptionKey),
        imageUri: typeof imageUri === 'string' ? imageUri : undefined,
      });
      continue;
    }

    categories[template.categoryId].push({
      id: `${template.categoryId}-${categories[template.categoryId].length + 1}`,
      title: t(template.titleKey),
      description: t(template.descriptionKey),
      imageSource: template.imageSource,
    });
  }

  return (Object.keys(CATEGORY_META) as RoadSignCategoryId[]).map((id) => ({
    id,
    title: t(CATEGORY_META[id].titleKey),
    icon: CATEGORY_META[id].icon,
    items: categories[id],
  }));
}
