создай сущности:

1 Tracking
name: string (index) (don`t len == 0)
calories: number (index) (min > 0 )
created: timestamp

2 Product 
name: (index) (don`t len == 0)
calories: count (ex:1000k) (min > 0)
massa: count (gramm) (min > 0)
image: {
	cover: string
	preview: string
} as json field | null
fluff_at: date ( timestamp)

4 RecipieType
	name (unique index)

3 Recipie
user: User (can null )
name: string (don`t len == 0)
type: related RecipieType (by name)
average: number (будет обновлять через подсчет средней оуенки в отзыве и по дефолту просто так его не должны обновлять)
image: {
	cover: string
	preview: string
} as json field
promotionalVideo: string
description: (can len == 0 or undefinded)
products: ManyToMany related with Product
fluff_at: timestamp
calories: number
cookAt: number (seconds)
stepsConfig: {
  steps: Step{
	name: string
	description
	resourse: Resours{
		position: number,
		sourse: string
		type: string
	}[]
  }[]
}
createdAt
updatedAt

4 Review

relatedEntityId: string
relatedEntityType: string
message: string
score: number (min >= 0 and max =< 5)
user: string
created: timestamp



Add fields if entity don`t have

Profile:
- полл
- height
- weight
