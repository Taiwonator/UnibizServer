import { LocationType, PrismaClient, EventType } from '@prisma/client'
import e from 'express'
import { arg, objectType, stringArg, mutationType, nonNull, list, mutationField, intArg } from 'nexus'
import { ObjectDefinitionBlock } from 'nexus/dist/core'
import { EventTypeEnum, Location, LocationTypeEnum, Node } from './helpers/index.js'
import slugify from '../lib/slugify.js'
import moment from 'moment'

const prisma = new PrismaClient()

export const Event = objectType({
  name: 'Event',
  definition(t) {
    t.implements(Node)
    t.string('name')
    t.string('slug')
    t.string('description')
    t.list.field('tags', { type: EventTypeEnum })
    t.string('thumbnailUrl')
    t.string('bannerUrl')
    t.list.string('eventImageUrls')
    t.int('likes')
    t.string('date')
    t.string('registerLink')
    t.string('createdAt')
    t.string('updatedAt')
    t.field('location', {
      type: Location,
      resolve: (parent) => {
        return prisma.event
          .findUnique({ where: { id: parent.id } })
          .location();
      },
    });
    t.field('society', {
      type: 'Society',
      resolve: (parent) => {
        return prisma.event
          .findUnique({ where: { id: parent.id } })
          .society();
      },
    });
  }
})

export const EventQueryDef = (t: ObjectDefinitionBlock<"Query">) => {
     t.list.field('Event', {
      type: Event,
      args: {
        societyId: stringArg(),
        unionId: stringArg(),
        tags: arg({ type: list(EventTypeEnum)})
      },
      resolve: async (_, { societyId, unionId, tags }) => {
        const eTags: EventType[] = tags
        let where = {};
        if (societyId) {
          where = { ...where, societyId };
        }
        if (unionId) {
          where = { ...where, society: { unionId } };
        }
        if (eTags) { // Add condition to filter events by tags
        where = {
          ...where,
          tags: { hasSome: eTags.map((tag: string) => EventType[tag]) },
        }
      }
        try {
          const events = await prisma.event.findMany({
            where,
            orderBy: {
              date: 'desc'
            }
          });
          return events;
        } catch(err) {
          console.log(err)
        }
      },
    });
    t.field('FindEventById', {
      type: Event,
      args: {
        id: stringArg()
      },
      resolve: async(_, { id }) => { 
        const event = await prisma.event.findUnique({where: { id }}) 
        return event
      }
    })
    t.list.field('FindEventBySocietyId', {
      type: Event,
      args: {
        societyId: stringArg()
      },
      resolve: async(_, { societyId }) => {
        const events = await prisma.event.findMany({
          where: { societyId },
        });
        return events;
      },
    });
    t.list.field('FindEventByUnionId', {
      type: Event,
      args: {
        unionId: stringArg()
      },
      resolve: async(_, { unionId }) => {
        const events = await prisma.event.findMany({
          where: { society: { unionId } },
        });
        return events;
      },
    });
    t.list.field('FindPastEvents', {
      type: Event,
      args: {
        societyId: stringArg(),
        unionId: stringArg(),
      },
      resolve: async (_, { societyId, unionId }) => {
        let where = {};
        if (societyId) {
          where = { ...where, societyId };
        }
        if (unionId) {
          where = { ...where, society: { unionId } };
        }

        try { 
          const now = new Date();
          const endOfDay = new Date(now.setHours(23, 59, 59, 999));
          const events = await prisma.event.findMany({
            where: {
              ...where,
              date: { lt: endOfDay },
            },
            orderBy: {
              date: 'desc',
            },
          });
          return events;
        } catch(err) {
          console.log(err)
          return null
        }
      },
    });

    t.list.field('FindSimilarEvents', {
      type: Event,
      args: {
        eventId: nonNull(stringArg()),
      },
      resolve: async (_, { eventId }) => {
        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) {
          throw new Error(`Event with ID ${eventId} not found.`);
        }
        const currentTime = new Date();
        const events = await prisma.event.findMany({
          where: {
            AND: [
              { id: { not: { equals: eventId } } },
              { tags: { hasSome: event.tags.map((tag: string) => EventType[tag]) } },
              { date: { gt: currentTime }}
            ],
          },
        });
        const sortedEvents = events.sort((a, b) => {
          const aTags = a.tags.filter((tag) => event.tags.includes(tag));
          const bTags = b.tags.filter((tag) => event.tags.includes(tag));
          return bTags.length - aTags.length;
        });
        return sortedEvents;
      },
    });

    t.list.field('FindUnverifiedEvents', {
      type: Event,
      resolve: async () => {
         let where = {
            society: {
              unionId: null
            }
          }
        try { 
          const now = new Date();
          const endOfDay = new Date(now.setHours(23, 59, 59, 999));
          const events = await prisma.event.findMany({
            where: {
              ...where,
              date: { lt: endOfDay },
            },
            orderBy: {
              date: 'desc',
            },
          });
          return events;
        } catch(err) {
          console.log(err)
          return null
        }
      },
    });
}

export const CreateEventResponse = objectType({
    name: "CreateEventResponse",
    definition(t) {
        t.string('id')
        t.string('slug')
    }
})

export const EventEditMutation = mutationField('editEvent', {
  type: Event,
  args: {
    id: nonNull(stringArg()),
    name: stringArg(),
    description: stringArg(),
    address: stringArg(),
    locationLink: stringArg(),
    locationType: arg({ type: LocationTypeEnum}),
    registerLink: stringArg(),
    date: stringArg(),
    bannerUrl: stringArg(),
    thumbnailUrl: stringArg(),
    tags: arg({ type: list(EventTypeEnum) }),
  },
  async resolve(_, args) {
    const event = await prisma.event.findUnique({ where: { id: args.id } })
    const location = await prisma.location.findUnique({ where: { id: event.locationId } })

      console.log('location: ', location, event.id)


    if (!event) {
      throw new Error(`Event with ID ${args.id} does not exist`)
    }

    const eventArgs = {
      name: args.name ?? event.name,
      slug: slugify(String(args.name ?? event.name)) + Date.now(),
      description: args.description ?? event.description,
      registerLink: args.registerLink ?? event.registerLink,
      date: args.date ? new Date(args.date) : event.date,
      bannerUrl: args.bannerUrl ?? event.bannerUrl,
      thumbnailUrl: args.thumbnailUrl ?? event.thumbnailUrl,
      tags: args.tags ?? event.tags,
    }

    try {
      const updatedEvent = await prisma.event.update({
        where: { id: args.id },
        data: eventArgs,
      })


      const locationArgs = {
        link: args.locationLink ?? location.link,
        address: args.address ?? location.address,
        type: args.locationType ?? location.type
      }

      try {
        const updatedLocation = await prisma.location.update({
          where: { id: location.id },
          data: locationArgs,
        })

        await prisma.event.update({ where: { id: args.id }, data: { locationId: updatedLocation.id }})

        return { ...updatedEvent, location: updatedLocation }
      } catch(err) {
        console.log(err)
        return null
      }
    } catch(err) {
      console.log(err)
      return null
    }
  },
})


export const EventCreateMutation = mutationField('createEvent', {
    type: 'CreateEventResponse',
    args: {
        name: nonNull(stringArg()),
        description: stringArg(),
        societyId: nonNull(stringArg()),
        address: stringArg(),
        locationLink: stringArg(),
        registerLink: stringArg(),
        date: nonNull(stringArg()),
        bannerUrl: stringArg(),
        thumbnailUrl: stringArg(),
        tags: arg({ type: list(EventTypeEnum) }),
    },
    async resolve(_, args) {
      const getLocationType = () => {
          if(args.address) {
            return LocationType.ADDRESS
          } else if (args.link) {
            return LocationType.ONLINE
          } else {
            return LocationType.TBD
          }
        }

      const eventArgs = {
          name: args.name,
          slug: slugify(String(args.name)) + Date.now(),
          description: args.description,
          society: {
            connect: {
              id: args.societyId
            }
          },
          registerLink: args.registerLink,
          date: new Date(args.date),
          bannerUrl: args.bannerUrl,
          thumbnailUrl: args.thumbnailUrl,
          tags: args.tags,
          location: {
            create: {
              type: getLocationType(),
              link: args.locationLink,
              address: args.address,
            }
          }
      }

      try {
        const createdEvent = await prisma.event.create({
          data: eventArgs,
        })
  

        // const locationArgs = {
        //     type: getLocationType(),
        //     link: args.locationLink,
        //     address: args.address,
        //     eventId: createdEvent.id
        // }

        // const createdLocation = await prisma.location.create({ data: locationArgs })

        return { slug: createdEvent.slug, id: createdEvent.id }
      } catch(err) {
        console.log('error: ', err)
        return null
      }
    },
})


export const LikeEventMutation = mutationField('likeEvent', {
  type: Event,
  args: {
    eventId: nonNull(stringArg()),
    userId: stringArg(),
  },
  resolve: async (_, { eventId, userId }) => {
    // Update user
    if(userId) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { 
              interestedEvents: {
                connect: { id: eventId }
              }
          },
        });
      } catch (error) {
        console.log(error);
        return null;
      }
    }

    // Update event
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });
      const updatedEvent = await prisma.event.update({
        where: { 
          id: eventId, 
        },
        data: { likes: event.likes + 1 },
      });
      return updatedEvent;
    } catch (error) {
      console.log(error);
      return null;
    }
  },
});


export const DeleteEventMutation = mutationField('deleteEvent', {
  type: Event,
  args: {
    id: nonNull(stringArg()),
  },
  async resolve(_, { id }) {
    const event = await prisma.event.findUnique({ where: { id } })

    if (!event) {
      throw new Error(`FAQ with ID ${id} does not exist`)
    }

    try {
      if (event.locationId) {
        const deletedLocation = await prisma.location.delete({
          where: { id: event.locationId }
        })
      }
      const deletedEvent = await prisma.event.delete({
        where: { id },
      })
      return deletedEvent
    } catch (err) {
      console.log(err)
    }
  },
})



// Verified
// No. Events
// No. Likes

export const AddEventImageUrlsMutation = mutationField('addEventImageUrls', {
  type: 'Event',
  args: {
    id: nonNull(stringArg()),
    imageUrls: nonNull(list(nonNull(stringArg()))),
  },
  resolve: async (_, { id, imageUrls }) => {
    try {
      const event = await prisma.event.update({
        where: {
          id,
        },
        data: {
          eventImageUrls: {
            push: imageUrls,
          },
        },
      });
      return event;
    } catch (err) {
      console.error(err);
      throw new Error('Failed to add image URLs to event');
    }
  },
});

export const DeleteEventImageUrl = mutationField('deleteEventImageUrl', {
  type: 'String',
  args: {
    id: nonNull(stringArg()),
    imageUrl: nonNull(stringArg()),
  },
  resolve: async (_, { id, imageUrl }) => {
    try {
      const event = await prisma.event.findUnique({
        where: { id },
        select: { eventImageUrls: true },
      });

      if (!event) {
        throw new Error('Event not found');
      }

      const index = event.eventImageUrls.indexOf(imageUrl);
      if (index > -1) {
        event.eventImageUrls.splice(index, 1);
      }

      await prisma.event.update({
        where: { id },
        data: { eventImageUrls: event.eventImageUrls },
      });

      return 'Image URL deleted successfully';
    } catch (error) {
      console.error(error);
      return error.message;
    }
  },
});


export const RecommendEvent = mutationField('RecommendEvent', {
  type: list(Event),
  args: {
    likedEventIds: nonNull(list(nonNull(stringArg()))),
  },
  resolve: async (_, { likedEventIds }) => {
    // Step 1: Compute popularity of event types from liked events
    const typeCounts = new Map<EventType, number>();
    for (const eventId of likedEventIds) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { tags: true },
      });
      if (!event) continue;
      for (const tag of event.tags) {
        typeCounts.set(tag, (typeCounts.get(tag) ?? 0) + 1);
      }
    }
    const sortedTypes = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]);
    const totalTypeCount = sortedTypes.reduce((acc, [_, count]) => acc + count, 0);

   // Step 2: Compute event scores based on their own tags and the popularity of types from liked events
    const currentTime = new Date()
    const events = await prisma.event.findMany({
      where: { 
        AND: [
          { id: { notIn: likedEventIds } },
          { date: { gt: currentTime } }
        ]
      },
      select: { id: true, name: true, tags: true, society: { select: { unionId: true } } },
    });

    const likedEvents = await Promise.all(
      likedEventIds.map((likedId) =>
        prisma.event.findUnique({
          where: { id: likedId },
          select: { society: { select: { unionId: true } } },
        })
      )
    );

      const scoredEvents = events.map((event) => {
        const typeScore = event.tags.reduce((acc, tag) => {
          const typeIndex = sortedTypes.findIndex(([type]) => type === tag);
          const typeWeight =
            typeIndex >= 0 ? (sortedTypes.length - typeIndex) / totalTypeCount : 0;
          return acc + typeWeight;
        }, 0);
        const unionCount = new Map<string, number>();
        for (const likedEvent of likedEvents) {
          if (
            likedEvent &&
            likedEvent.society.unionId === event.society.unionId
          ) {
            unionCount.set(
              event.society.unionId,
              (unionCount.get(event.society.unionId) ?? 0) + 1
            );
          }
        }
        const sortedUnions = [...unionCount.entries()].sort(
          (a, b) => b[1] - a[1]
        );
        return { eventId: event.id, event, score: typeScore * (sortedUnions[0]?.[1] ?? 0) };
      });

      const sortedScoredEvents =  scoredEvents.sort((a, b) => b.score - a.score);
      const splicedSortedEvents = sortedScoredEvents.slice(0, 3).filter(e => e.score !== 0)
    
      const rEvents = await Promise.all(
        splicedSortedEvents.map((e) =>
          prisma.event.findUnique({
            where: { id: e.event.id }
          })
        )
      );


      return rEvents ?? null;
  },
});