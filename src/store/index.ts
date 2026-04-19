export interface Note {
  content: string
  createdAt: number
  updatedAt: number
}

export interface NoteDbDoc extends Note {
  _id: DbDoc['_id']
  _rev: DbDoc['_rev']
}

export class StoreService {
  public async findMany() {
    const result = (await utools.db.promises.allDocs()) as Array<NoteDbDoc>
    // Sort by updateAt desc
    result.sort((a, b) => b.updatedAt - a.updatedAt)

    return result
  }

  public async findOne(_id: DbDoc['_id']) {
    return (await utools.db.promises.get(_id)) as NoteDbDoc
  }

  public async create(note: Pick<Note, 'content'>) {
    const createAt = Date.now()
    const updatedAt = createAt
    const id = crypto.randomUUID()

    const noteDbDoc = {
      _id: id,
      ...note,
      createdAt: createAt,
      updatedAt,
    }

    console.log({
      service: 'StoreService',
      method: 'create',
      stage: 'create noteDbDoc',
      noteDbDoc,
    })

    const dbReturn = await utools.db.promises.put(noteDbDoc)
    if(dbReturn.ok) {
      return {
        ...noteDbDoc,
        _rev: dbReturn.rev,
      }
    } else {
      console.error(dbReturn.message)
      throw new Error('create noteDbDoc failed')
    }
  }

  public async update(
    _id: DbDoc['_id'],
    doc: Omit<DbDoc, '_id'>
  ) {
    const updatedAt = Date.now()

    const noteDbDoc = {
      _id,
      ...doc,
      updatedAt,
    } as NoteDbDoc

    console.log({
      service: 'StoreService',
      method: 'update',
      stage: 'update noteDbDoc',
      noteDbDoc,
    })

    const dbReturn = await utools.db.promises.put(noteDbDoc)

    if(dbReturn.ok) {
      return {
        ...noteDbDoc,
        _rev: dbReturn.rev,
      }
    } else {
      console.error(dbReturn.message)
      throw new Error('update noteDbDoc failed')
    }
  }

  public async delete(_id: DbDoc['_id']) {
    const dbReturn = await utools.db.promises.remove(_id)

    console.log({
      service: 'StoreService',
      method: 'delete',
      stage: 'delete noteDbDoc',
      _id,
      dbReturn,
    })

    if(dbReturn.ok) {
      return dbReturn
    } else {
      console.error(dbReturn.message)
      throw new Error('delete noteDbDoc failed')
    }
  }
}

export default new StoreService()
