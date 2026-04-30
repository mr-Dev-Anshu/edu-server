import {Book} from "../models/index.js"
import {BaseRepository} from "./base.repository.js"

export class BookRepository extends BaseRepository {
    constructor(){
        super(Book)
    }
}

