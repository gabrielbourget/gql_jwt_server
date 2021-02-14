// -> Beyond codebase
import { Field, Int, ObjectType } from "type-graphql";
import {
  Entity, PrimaryGeneratedColumn, Column, BaseEntity
} from "typeorm";
// -> Within codebase
// import { IUserMetadata } from "../Types";

// - TODO: -> Figure out how to embed user metadata as a composite type, instead of
//            just spreading out all properties across this data structure.
@ObjectType()
@Entity("Users")
export class User extends BaseEntity {
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column("text")
    email: string;

    @Column("text")
    password: string;

    @Column("int", { default: 0 })
    tokenVersion: number;

    @Column("text")
    temp2FASecret?: string;

    @Column("text")
    MFASecret?: string;
}
