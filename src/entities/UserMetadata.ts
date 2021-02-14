import { Field, ObjectType } from "type-graphql";
import { Column, Entity } from "typeorm";

@ObjectType()
@Entity("UserMetadata")
export class UserMetadata {
  @Field()
  @Column("text")
  tempMFASecret?: string;
  
  @Field()
  @Column("text")
  MFASecret?: string;
}
