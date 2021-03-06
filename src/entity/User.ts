// -> Beyond codebase
import { Field, Int, ObjectType } from "type-graphql";
import {
  Entity, PrimaryGeneratedColumn, Column, BaseEntity
} from "typeorm";
// -> Within codebase
// import { UserMetadata } from "./UserMetadata";

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

    @Field()
    @Column("text", { nullable: true })
    tempMFASecret?: string;
    
    @Field()
    @Column("text", { nullable: true })
    MFASecret?: string;

    @Column("int", { default: 0 })
    tokenVersion: number;

    // - TODO: -> Check back on this issue periodically to see if Embedded Entities
    //            can be defined as potentially nullable yet.
    //            https://github.com/typeorm/typeorm/issues/5787
    // @Field(() => UserMetadata)
    // @Column(() => UserMetadata)
    // metadata: UserMetadata;


}
